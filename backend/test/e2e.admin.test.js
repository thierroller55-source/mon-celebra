import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { seedCatalog } from './helpers/seed.js';
import { createApiClient } from './helpers/api.js';
import { createAdminClient, createUserClient } from './helpers/accounts.js';

let server;
let baseUrl;

test.before(async () => {
  await connectTestDB();
  await seedCatalog();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
  await stopMongo();
});

test('acces admin : un "user" est refuse -> 403', async () => {
  const { api } = await createUserClient(baseUrl);
  const res = await api.get('/admin/stats');
  assert.equal(res.status, 403);
});

test('acces admin : non authentifie -> 401', async () => {
  const anon = createApiClient(baseUrl);
  const res = await anon.get('/admin/stats');
  assert.equal(res.status, 401);
});

test('GET /admin/stats : compteurs et repartition par categorie', async () => {
  const { api } = await createAdminClient(baseUrl);
  const res = await api.get('/admin/stats');
  assert.equal(res.status, 200);
  const stats = res.body.data.stats;
  assert.equal(typeof stats.users, 'number');
  assert.equal(typeof stats.events, 'number');
  assert.ok(Array.isArray(stats.eventsByCategory));
});

test('GET /admin/users : pagination, recherche et filtre role', async () => {
  const { api } = await createAdminClient(baseUrl);
  const visitor = await createUserClient(baseUrl, { firstName: 'ChercheMoi' });

  const all = await api.get('/admin/users?limit=5');
  assert.equal(all.status, 200);
  assert.ok(all.body.data.pagination.total >= 1);
  assert.ok(all.body.data.users.length <= 5);

  const search = await api.get('/admin/users?search=ChercheMoi');
  assert.ok(search.body.data.users.some((u) => u._id === visitor.user._id));

  const byRole = await api.get('/admin/users?role=user');
  assert.ok(byRole.body.data.users.every((u) => u.role === 'user'));
});

test('PATCH /admin/users/:id/block puis /unblock', async () => {
  const { api } = await createAdminClient(baseUrl);
  const { user } = await createUserClient(baseUrl);

  const blocked = await api.patch(`/admin/users/${user._id}/block`);
  assert.equal(blocked.status, 200);
  assert.equal(blocked.body.data.user.isActive, false);

  const unblocked = await api.patch(`/admin/users/${user._id}/unblock`);
  assert.equal(unblocked.status, 200);
  assert.equal(unblocked.body.data.user.isActive, true);
});

test('PATCH /admin/users/:id/block : soi-meme -> 400 SELF_BLOCK', async () => {
  const { api, user } = await createAdminClient(baseUrl);
  const res = await api.patch(`/admin/users/${user._id}/block`);
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'SELF_BLOCK');
});

test('DELETE /admin/users/:id : supprime le compte et ses evenements', async () => {
  const { api } = await createAdminClient(baseUrl);
  const { api: owner, user } = await createUserClient(baseUrl);
  const ev = await owner.post('/events', {
    category: 'graduation',
    title: 'A supprimer',
    details: { graduateName: 'X' },
  });
  assert.equal(ev.status, 201);

  const res = await api.delete(`/admin/users/${user._id}`);
  assert.equal(res.status, 200);

  const events = await api.get('/admin/events');
  assert.ok(!events.body.data.events.some((e) => e.ownerId?._id === user._id));
});

test('DELETE /admin/users/:id : soi-meme -> 400 SELF_DELETE', async () => {
  const { api, user } = await createAdminClient(baseUrl);
  const res = await api.delete(`/admin/users/${user._id}`);
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'SELF_DELETE');
});

test('GET /admin/events : filtre par statut + suppression', async () => {
  const { api } = await createAdminClient(baseUrl);
  const { api: owner } = await createUserClient(baseUrl);
  const created = await owner.post('/events', {
    category: 'graduation',
    title: 'AdminEvents',
    details: { graduateName: 'Y' },
  });
  const event = created.body.data.event;

  const published = await api.get('/admin/events?status=draft');
  assert.ok(published.body.data.events.some((e) => e._id === event._id));

  const del = await api.delete(`/admin/events/${event._id}`);
  assert.equal(del.status, 200);
});

test('admin reports : liste puis changement de statut', async () => {
  const { api } = await createAdminClient(baseUrl);
  const { api: owner } = await createUserClient(baseUrl);
  const created = await owner.post('/events', {
    category: 'graduation',
    title: 'Signale',
    details: { graduateName: 'Z' },
  });
  const event = created.body.data.event;

  const guest = createApiClient(baseUrl);
  const report = await guest.post('/reports', {
    eventId: event._id,
    reason: 'Motif de signalement valable.',
  });
  assert.equal(report.status, 201);

  const list = await api.get('/admin/reports');
  assert.equal(list.status, 200);
  const target = list.body.data.reports.find((r) => r.eventId?._id === event._id);
  assert.ok(target);

  const closed = await api.patch(`/admin/reports/${target._id}`, { status: 'closed' });
  assert.equal(closed.status, 200);
  assert.equal(closed.body.data.report.status, 'closed');

  const invalid = await api.patch(`/admin/reports/${target._id}`, { status: 'nope' });
  assert.equal(invalid.status, 400);
});

test('admin categories : CRUD complet', async () => {
  const { api } = await createAdminClient(baseUrl);
  const list = await api.get('/admin/categories');
  assert.equal(list.status, 200);
  assert.ok(list.body.data.categories.length >= 11);

  const create = await api.post('/admin/categories', {
    name: 'Test Categorie',
    slug: `test-cat-${Date.now()}`,
    icon: 'sparkles',
    order: 99,
  });
  assert.equal(create.status, 201);
  const id = create.body.data.category._id;

  const update = await api.put(`/admin/categories/${id}`, { name: 'Test Categorie v2' });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.category.name, 'Test Categorie v2');

  const del = await api.delete(`/admin/categories/${id}`);
  assert.equal(del.status, 200);

  const missing = await api.put('/admin/categories/64b7f9f9f9f9f9f9f9f9f9f9', { name: 'x' });
  assert.equal(missing.status, 404);
});

test('admin templates : CRUD complet', async () => {
  const { api } = await createAdminClient(baseUrl);
  const list = await api.get('/admin/templates');
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body.data.templates));

  const create = await api.post('/admin/templates', {
    name: 'Modele Test',
    categorySlug: 'graduation',
    componentKey: 'graduation-classic',
    order: 50,
  });
  assert.equal(create.status, 201, JSON.stringify(create.body));
  const id = create.body.data.template._id;

  const update = await api.put(`/admin/templates/${id}`, { name: 'Modele Test v2' });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.template.name, 'Modele Test v2');

  const del = await api.delete(`/admin/templates/${id}`);
  assert.equal(del.status, 200);
});

test('POST /admin/email-health : renvoie la config sans exposer de secret', async () => {
  const { api } = await createAdminClient(baseUrl);
  const res = await api.post('/admin/email-health');
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.config.provider, 'brevo');
  assert.equal(typeof res.body.data.config.configured, 'boolean');
  assert.ok(!JSON.stringify(res.body).toLowerCase().includes('xkeysib'));
});
