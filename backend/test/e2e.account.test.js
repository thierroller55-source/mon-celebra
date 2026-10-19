import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { createApiClient } from './helpers/api.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { User } from '../src/models/User.js';
import { sendEmailVerification } from '../src/services/emailVerification.service.js';

let server;
let api;

async function startGuest() {
  const res = await api.post('/auth/guest');
  assert.ok(res.status === 200 || res.status === 201, `guest status ${res.status}`);
  api.setToken(res.body.data.accessToken);
  return res.body.data.user;
}

test.before(async () => {
  await connectTestDB();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  api = createApiClient(`http://127.0.0.1:${server.address().port}/api`);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
  await stopMongo();
});

test('GET /me : session invite authentifiee', async () => {
  await startGuest();
  const res = await api.get('/me');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.isGuest, true);
});

test('PATCH /me : met a jour prenom, telephone et langue', async () => {
  await startGuest();
  const res = await api.patch('/me', {
    firstName: 'Awa',
    lastName: 'Diop',
    phone: '771234567',
    language: 'en',
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.firstName, 'Awa');
  assert.equal(res.body.data.user.phone, '771234567');
  assert.equal(res.body.data.user.language, 'en');
  assert.equal(res.body.data.emailChangeRequested, false);
});

test('PATCH /me : corps vide -> 400', async () => {
  await startGuest();
  const res = await api.patch('/me', {});
  assert.equal(res.status, 400);
});

test('PATCH /me : demander un nouvel email le met en attente sans le changer', async () => {
  const user = await startGuest();
  const next = `pending-${Date.now()}@example.com`;
  const res = await api.patch('/me', { email: next });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.emailChangeRequested, true);
  assert.equal(res.body.data.user.pendingEmail, next);
  assert.equal(res.body.data.user.email, user.email);
});

test('PATCH /me : email deja pris (y compris en attente) -> 409', async () => {
  const first = await startGuest();
  const shared = `shared-${Date.now()}@example.com`;
  const ok = await api.patch('/me', { email: shared });
  assert.equal(ok.status, 200);

  await startGuest();
  const res = await api.patch('/me', { email: shared });
  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'EMAIL_TAKEN');
  assert.ok(first);
});

test('verify-email : confirme le nouvel email et convertit le compte invite', async () => {
  await startGuest();
  const next = `confirm-${Date.now()}@example.com`;
  await api.patch('/me', { email: next });
  const me = await api.get('/me');
  assert.equal(me.body.data.pendingEmail, next);

  const user = await User.findById(me.body.data._id);
  const { token } = await sendEmailVerification(user, next);
  assert.ok(token);

  const verified = await api.post('/auth/verify-email', { token });
  assert.equal(verified.status, 200);

  const after = await api.get('/me');
  assert.equal(after.body.data.email, next);
  assert.equal(after.body.data.emailVerified, true);
  assert.equal(after.body.data.isGuest, false);
  assert.equal(after.body.data.pendingEmail, undefined);
});

test('POST /me/password : mot de passe faible -> 400', async () => {
  await startGuest();
  const res = await api.post('/me/password', { newPassword: 'faible' });
  assert.equal(res.status, 400);
});

test('POST /me/password : un invite definit son mot de passe sans ancien', async () => {
  await startGuest();
  const res = await api.post('/me/password', { newPassword: 'N0uveau!Pass' });
  assert.equal(res.status, 200);
});

test('POST /me/password : compte classique exige le mot de passe actuel', async () => {
  const register = await api.post('/auth/register', {
    firstName: 'Admin',
    lastName: 'Test',
    email: `admin-${Date.now()}@example.com`,
    password: 'Str0ng!Pass',
  });
  assert.equal(register.status, 201);

  const login = await api.post('/auth/login', {
    email: register.body.data.user.email,
    password: 'Str0ng!Pass',
  });
  assert.equal(login.status, 200);
  api.setToken(login.body.data.accessToken);

  const wrong = await api.post('/me/password', {
    currentPassword: 'Mauvais!Pass1',
    newPassword: 'N0uveau!Pass',
  });
  assert.equal(wrong.status, 401);

  const ok = await api.post('/me/password', {
    currentPassword: 'Str0ng!Pass',
    newPassword: 'N0uveau!Pass',
  });
  assert.equal(ok.status, 200);

  const oldLogin = await api.post('/auth/login', {
    email: register.body.data.user.email,
    password: 'Str0ng!Pass',
  });
  assert.equal(oldLogin.status, 401);

  const newLogin = await api.post('/auth/login', {
    email: register.body.data.user.email,
    password: 'N0uveau!Pass',
  });
  assert.equal(newLogin.status, 200);
});
