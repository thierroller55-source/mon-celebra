import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { seedCatalog } from './helpers/seed.js';
import { createApiClient } from './helpers/api.js';
import { createUserClient } from './helpers/accounts.js';

let server;
let baseUrl;
let admin;

function createEvent(api, overrides = {}) {
  return api.post('/events', {
    category: 'graduation',
    title: overrides.title || 'Evenement premium',
    details: overrides.details || { graduateName: 'Awa Diop' },
    ...overrides,
  });
}

test.before(async () => {
  await connectTestDB();
  await seedCatalog();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  admin = createApiClient(baseUrl);
  const registered = await admin.post('/auth/register', {
    firstName: 'Admin',
    lastName: 'Premium',
    email: `admin-${Date.now()}@test.moncelebra.local`,
    password: 'Str0ng!Pass',
  });
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  admin.setToken(registered.body.data.accessToken);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
  await stopMongo();
});

test('nouveau compte : formule gratuite et quota de 3 evenements actifs', async () => {
  const { api, user } = await createUserClient(baseUrl);
  assert.equal(user.plan, 'free');
  assert.equal(user.premiumUntil, null);

  for (let index = 1; index <= 3; index += 1) {
    const created = await createEvent(api, { title: `Gratuit ${index}` });
    assert.equal(created.status, 201, JSON.stringify(created.body));
  }

  const blocked = await createEvent(api, { title: 'Gratuit 4' });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, 'QUOTA_REACHED');

  const me = await api.get('/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.plan, 'free');
});

test('admin active Premium : quota elargi, templates premium et expiration', async () => {
  const { api, user } = await createUserClient(baseUrl);
  const templates = await api.get('/templates?category=mariage');
  assert.equal(templates.status, 200);
  const premiumTemplate = templates.body.data.templates.find((tpl) => tpl.isPremium);
  assert.ok(premiumTemplate, 'un template premium de mariage doit exister');

  const denied = await createEvent(api, {
    category: 'mariage',
    title: 'Mariage luxe refuse',
    details: {},
    templateId: premiumTemplate._id,
  });
  assert.equal(denied.status, 403, JSON.stringify(denied.body));
  assert.equal(denied.body.code, 'PREMIUM_REQUIRED');

  const upgraded = await admin.patch(`/admin/users/${user._id}/plan`, { plan: 'premium' });
  assert.equal(upgraded.status, 200, JSON.stringify(upgraded.body));
  assert.equal(upgraded.body.data.user.plan, 'premium');
  assert.equal(upgraded.body.data.user.premiumSource, 'manual');
  assert.equal(upgraded.body.data.user.premiumUntil, null);

  const created = await createEvent(api, {
    category: 'mariage',
    title: 'Mariage luxe',
    templateId: premiumTemplate._id,
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.data.event.templateId, premiumTemplate._id);

  const me = await api.get('/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.plan, 'premium');

  // Un template premium deja utilise reste modifiable apres un downgrade.
  const downgraded = await admin.patch(`/admin/users/${user._id}/plan`, { plan: 'free' });
  assert.equal(downgraded.status, 200);
  assert.equal(downgraded.body.data.user.plan, 'free');

  const eventId = created.body.data.event._id;
  const updated = await api.put(`/events/${eventId}`, {
    category: 'mariage',
    title: 'Mariage luxe modifie',
    templateId: premiumTemplate._id,
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));

  const newPremium = await createEvent(api, {
    category: 'mariage',
    title: 'Nouveau mariage luxe',
    templateId: premiumTemplate._id,
  });
  assert.equal(newPremium.status, 403);
  assert.equal(newPremium.body.code, 'PREMIUM_REQUIRED');
});

test('formule Premium : date d expiration et validation admin', async () => {
  const { api, user } = await createUserClient(baseUrl);
  const past = new Date(Date.now() - 60_000).toISOString();
  const expired = await admin.patch(`/admin/users/${user._id}/plan`, {
    plan: 'premium',
    premiumUntil: past,
  });
  assert.equal(expired.status, 200, JSON.stringify(expired.body));
  assert.equal(expired.body.data.user.plan, 'premium');

  // Le plan stocke reste premium, mais les droits sont ceux du gratuit.
  const blocked = await createEvent(api, { title: 'Expire 1' });
  assert.equal(blocked.status, 201);
  const me = await api.get('/me');
  assert.equal(me.body.data.plan, 'premium');
  assert.ok(new Date(me.body.data.premiumUntil).getTime() < Date.now());

  const invalid = await admin.patch(`/admin/users/${user._id}/plan`, { plan: 'gold' });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.code, 'VALIDATION_ERROR');
});
