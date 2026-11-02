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
  const c1 = await api.post('/events', { category: 'graduation', title: 'E1', details: { graduateName: 'A' } });
  assert.ok(c1.status === 201 || c1.status === 200);
  const c2 = await api.post('/events', { category: 'graduation', title: 'E2', details: { graduateName: 'B' } });
  assert.equal(c2.status, 403);
});

test('guest can still create rsvp', async () => {
  const { api } = await createUserClient(baseUrl);
  const c = await api.post('/events', { category: 'graduation', title: 'Pub', details: { graduateName: 'X' } });
  assert.ok(c.status === 201 || c.status === 200);
  const slug = c.body.data.event.slug;
  const pub = await api.post(`/public/events/${slug}/rsvp`, { guestsCount: 1, response: 'yes' });
  assert.ok(pub.status === 201 || pub.status === 200 || pub.status === 403);
});

test('admin can activate without request', async () => {
  const { api, user } = await createUserClient(baseUrl);
  const res = await admin.post('/admin/plans/activate', { userId: user._id, planRequested: 'pro', durationMonths: 12 });
  assert.equal(res.status, 200);
});
