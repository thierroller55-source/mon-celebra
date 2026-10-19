import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { createApiClient } from './helpers/api.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { User } from '../src/models/User.js';

let server;
let api;

async function startGuest() {
  const res = await api.post('/auth/guest');
  assert.ok(res.status === 200 || res.status === 201);
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

test('resend-verification : sans fournisseur configure, repond 503 (pas de faux succes)', async () => {
  // BREVO_API_KEY='' dans les tests -> aucun email ne peut partir.
  await startGuest();
  const res = await api.post('/auth/resend-verification');
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'EMAIL_NOT_CONFIGURED');
  assert.equal(res.body.success, false);
});

test('resend-verification : email deja verifie -> message dedie', async () => {
  const user = await startGuest();
  await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
  const res = await api.post('/auth/resend-verification');
  assert.equal(res.status, 200);
});

test('PATCH /me : renvoie emailSent=false quand aucun fournisseur email', async () => {
  await startGuest();
  const res = await api.patch('/me', { email: `pending-${Date.now()}@example.com` });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.emailChangeRequested, true);
  // Sans fournisseur, l'email n'a pas pu partir : le client doit le savoir.
  assert.equal(res.body.data.emailSent, false);
});

test('anti-spam : deux renvois trop rapproches sont refuses', async () => {
  const user = await startGuest();
  // Simule un envoi recent (il y a 5 s) pour declencher le cooldown.
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerificationSentAt: new Date(Date.now() - 5000) } },
  );
  const res = await api.post('/auth/resend-verification');
  assert.equal(res.status, 429);
  assert.equal(res.body.code, 'RESEND_TOO_SOON');
  assert.ok(res.body.details?.retryAfterSeconds > 0);
});
