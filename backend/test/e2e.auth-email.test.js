import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { createApiClient } from './helpers/api.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';

let server;
let api;

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

test('mot de passe oublie : reponse generique 200 (anti-enumeration)', async () => {
  const res = await api.post('/auth/forgot-password', { email: 'inconnu@example.com' });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.match(res.body.data.message, /lien de reinitialisation/i);
});

test('verification email : jeton invalide -> 400', async () => {
  const res = await api.post('/auth/verify-email', { token: 'jeton-bidon' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'INVALID_VERIFICATION_TOKEN');
});

test('verification email : jeton manquant -> 400 (validation)', async () => {
  const res = await api.post('/auth/verify-email', {});
  assert.equal(res.status, 400);
});

test('reinitialisation : jeton invalide -> 400', async () => {
  const res = await api.post('/auth/reset-password/jeton-bidon', {
    password: 'MotDePasse1!',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'INVALID_RESET_TOKEN');
});

test('renvoi de verification : refuse sans authentification -> 401', async () => {
  const res = await api.post('/auth/resend-verification');
  assert.equal(res.status, 401);
});
