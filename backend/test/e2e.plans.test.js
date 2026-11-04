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
    lastName: 'Plans',
    email: `admin-plans-${Date.now()}@test.moncelebra.local`,
    password: 'Str0ng!Pass',
  });
  assert.equal(registered.status, 201);
  admin.setToken(registered.body.data.accessToken);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
  await stopMongo();
});

test('free user cannot create second event', async () => {
  const { api } = await createUserClient(baseUrl);
  const c1 = await api.post('/events', {
    category: 'graduation',
    title: 'Evenement 1',
    details: { graduateName: 'A' },
  });
  assert.equal(c1.status, 201, JSON.stringify(c1.body));
  const c2 = await api.post('/events', {
    category: 'graduation',
    title: 'Evenement 2',
    details: { graduateName: 'B' },
  });
  assert.equal(c2.status, 403);
});

test('un compte connecte peut confirmer sa presence', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const c = await host.post('/events', {
    category: 'graduation',
    title: 'Soiree publique',
    details: { graduateName: 'X' },
  });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  const published = await host.post(`/events/${c.body.data.event._id}/publish`);
  assert.equal(published.status, 200, JSON.stringify(published.body));

  const slug = c.body.data.event.slug;
  const visitor = await createUserClient(baseUrl);
  const pub = await visitor.api.post(`/public/events/${slug}/rsvp`, {
    guestsCount: 1,
    response: 'yes',
  });
  assert.equal(pub.status, 201, JSON.stringify(pub.body));
});

test('une session invite ne peut pas confirmer sa presence', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const c = await host.post('/events', {
    category: 'graduation',
    title: 'Soiree invite',
    details: { graduateName: 'Y' },
  });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  await host.post(`/events/${c.body.data.event._id}/publish`);

  const guest = createApiClient(baseUrl);
  const session = await guest.post('/auth/guest');
  assert.equal(session.status, 201, JSON.stringify(session.body));
  guest.setToken(session.body.data.accessToken);

  const pub = await guest.post(`/public/events/${c.body.data.event.slug}/rsvp`, {
    guestsCount: 1,
    response: 'yes',
  });
  assert.equal(pub.status, 403);
  assert.equal(pub.body.code, 'ACCOUNT_REQUIRED');
});

test('admin can activate without request', async () => {
  const { api, user } = await createUserClient(baseUrl);
  const res = await admin.post('/admin/plans/activate', { userId: user._id, planRequested: 'pro', durationMonths: 12 });
  assert.equal(res.status, 200);
});
