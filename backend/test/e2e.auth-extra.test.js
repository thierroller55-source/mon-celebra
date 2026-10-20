import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { createApiClient } from './helpers/api.js';

let server;
let baseUrl;

test.before(async () => {
  await connectTestDB();
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

test('POST /auth/signup : cree un compte "user" et ouvre une session', async () => {
  const api = createApiClient(baseUrl);
  const email = `inscrit-${Date.now()}@test.local`;
  const res = await api.post('/auth/signup', {
    firstName: 'Fatou',
    lastName: 'Ndiaye',
    email,
    password: 'Str0ng!Pass',
    phone: '781234567',
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.data.user.role, 'user');
  assert.equal(res.body.data.user.isGuest, false);
  assert.ok(res.body.data.accessToken);

  api.setToken(res.body.data.accessToken);
  const me = await api.get('/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.email, email);
});

test('POST /auth/signup : email deja pris -> 409', async () => {
  const api = createApiClient(baseUrl);
  const email = `dup-${Date.now()}@test.local`;
  const payload = {
    firstName: 'A',
    lastName: 'B',
    email,
    password: 'Str0ng!Pass',
  };
  const first = await api.post('/auth/signup', payload);
  assert.equal(first.status, 201);

  const second = await api.post('/auth/signup', payload);
  assert.equal(second.status, 409);
  assert.equal(second.body.code, 'EMAIL_TAKEN');
});

test('POST /auth/signup : mot de passe faible -> 400', async () => {
  const api = createApiClient(baseUrl);
  const res = await api.post('/auth/signup', {
    firstName: 'A',
    lastName: 'B',
    email: `weak-${Date.now()}@test.local`,
    password: 'faible',
  });
  assert.equal(res.status, 400);
});

test('POST /auth/logout : vide le cookie de session', async () => {
  const res = await fetch(`${baseUrl}/auth/logout`, { method: 'POST' });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get('set-cookie') || '';
  assert.match(setCookie, /refresh/i);
});

test('POST /auth/refresh : sans cookie -> 401 NO_REFRESH_TOKEN', async () => {
  const res = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST' });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.code, 'NO_REFRESH_TOKEN');
});

test('POST /auth/refresh : avec cookie valide renvoie un nouvel access token', async () => {
  const email = `refresh-${Date.now()}@test.local`;
  const signup = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'A', lastName: 'B', email, password: 'Str0ng!Pass' }),
  });
  assert.equal(signup.status, 201);
  const cookie = (signup.headers.get('set-cookie') || '').split(';')[0];
  assert.ok(cookie.includes('refresh'));

  const refresh = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  assert.equal(refresh.status, 200);
  const body = await refresh.json();
  assert.ok(body.data.accessToken);
  assert.equal(body.data.user.email, email);
});

test('POST /auth/resend-verification : exige une session', async () => {
  const anon = await fetch(`${baseUrl}/auth/resend-verification`, { method: 'POST' });
  assert.equal(anon.status, 401);

  const api = createApiClient(baseUrl);
  const signup = await api.post('/auth/signup', {
    firstName: 'A',
    lastName: 'B',
    email: `resend-${Date.now()}@test.local`,
    password: 'Str0ng!Pass',
  });
  api.setToken(signup.body.data.accessToken);

  // Le signup declenche deja un envoi best-effort : le renvoi immediat tombe
  // dans le cooldown anti-spam (429). Sinon, sans fournisseur configure, la
  // route repond honnetement 503 (voir e2e.email-health.test.js).
  const res = await api.post('/auth/resend-verification');
  assert.ok([200, 429, 503].includes(res.status), JSON.stringify(res.body));
});
