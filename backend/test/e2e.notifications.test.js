import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { seedCatalog } from './helpers/seed.js';
import { createUserClient } from './helpers/accounts.js';
import { Notification } from '../src/models/Notification.js';

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

test('GET /notifications : non authentifie -> 401', async () => {
  const res = await fetch(`${baseUrl}/notifications`);
  assert.equal(res.status, 401);
});

test('GET /notifications : liste vide puis triee par date', async () => {
  const { api, user } = await createUserClient(baseUrl);

  const empty = await api.get('/notifications');
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body.data.notifications, []);

  await Notification.create({ userId: user._id, type: 'system', title: 'Ancienne', message: 'a' });
  await new Promise((r) => setTimeout(r, 5));
  await Notification.create({ userId: user._id, type: 'system', title: 'Recente', message: 'b' });

  const list = await api.get('/notifications');
  assert.equal(list.status, 200);
  assert.equal(list.body.data.notifications.length, 2);
  assert.equal(list.body.data.notifications[0].title, 'Recente');
});

test('GET /notifications/unread-count : compte les non lues', async () => {
  const { api, user } = await createUserClient(baseUrl);
  await Notification.create({ userId: user._id, type: 'system', title: 'x', message: 'x', read: false });
  await Notification.create({ userId: user._id, type: 'system', title: 'y', message: 'y', read: true });

  const res = await api.get('/notifications/unread-count');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.count, 1);
});

test('PATCH /notifications/:id/read : marque une notification comme lue', async () => {
  const { api, user } = await createUserClient(baseUrl);
  const n = await Notification.create({ userId: user._id, type: 'system', title: 'x', message: 'x' });

  const res = await api.patch(`/notifications/${n._id}/read`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.notification.read, true);

  const count = await api.get('/notifications/unread-count');
  assert.equal(count.body.data.count, 0);
});

test('PATCH /notifications/:id/read : notification d\'un autre -> 404', async () => {
  const { user } = await createUserClient(baseUrl);
  const other = await createUserClient(baseUrl);
  const n = await Notification.create({ userId: user._id, type: 'system', title: 'x', message: 'x' });

  const res = await other.api.patch(`/notifications/${n._id}/read`);
  assert.equal(res.status, 404);
});

test('POST /notifications/read-all : marque tout comme lu', async () => {
  const { api, user } = await createUserClient(baseUrl);
  await Notification.create({ userId: user._id, type: 'system', title: 'a', message: 'a' });
  await Notification.create({ userId: user._id, type: 'system', title: 'b', message: 'b' });

  const res = await api.post('/notifications/read-all');
  assert.equal(res.status, 200);

  const count = await api.get('/notifications/unread-count');
  assert.equal(count.body.data.count, 0);
});
