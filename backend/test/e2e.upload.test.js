import './helpers/mongo.js';

import fs from 'node:fs/promises';
import sharp from 'sharp';
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { createApiClient } from './helpers/api.js';
import { seedCatalog } from './helpers/seed.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';

let server;
let api;
let authToken;
const uploadDir = process.env.UPLOAD_DIR;

test.before(async () => {
  await connectTestDB();
  await seedCatalog();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  api = createApiClient(`http://127.0.0.1:${server.address().port}/api`);
  const guest = await api.post('/auth/guest');
  authToken = guest.body.data.accessToken;
  api.setToken(authToken);
  await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
  await stopMongo();
});

async function upload(blob, filename, { auth = true } = {}) {
  const fd = new FormData();
  fd.append('image', blob, filename);
  const token = auth ? (await api.post('/auth/guest')).body.data.accessToken : null;
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/uploads/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

test('upload local : info, normalisation WebP, fichier stocke, suppression', async () => {
  const info = await api.get('/uploads/info');
  assert.equal(info.status, 200);
  assert.equal(info.body.data.driver, 'local');

  const jpeg = await sharp({
    create: {
      width: 2000,
      height: 1200,
      channels: 3,
      background: { r: 176, g: 141, b: 87, alpha: 1 },
    },
  })
    .jpeg()
    .toBuffer();

  const res = await upload(new Blob([jpeg], { type: 'image/jpeg' }), 'fond.jpg');
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.data.provider, 'local');
  assert.equal(res.body.data.format, 'webp');
  assert.ok(res.body.data.url.includes('/uploads/'));
  assert.ok(res.body.data.url.endsWith('.webp'));

  // Le fichier existe reellement sur le disque
  const files = await fs.readdir(uploadDir);
  assert.ok(files.includes(res.body.data.publicId), 'fichier webp stocke');

  // Suppression
  const del = await api.delete(
    `/uploads/image?publicId=${encodeURIComponent(res.body.data.publicId)}`,
  );
  assert.equal(del.status, 200);
  const remaining = await fs.readdir(uploadDir);
  assert.ok(!remaining.includes(res.body.data.publicId), 'fichier supprime');
});

test('upload refuse : type non image -> 400', async () => {
  const res = await upload(new Blob(['pas une image'], { type: 'text/plain' }), 'note.txt');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'INVALID_FILE_TYPE');
});

test('upload refuse : sans authentification -> 401', async () => {
  const jpeg = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .jpeg()
    .toBuffer();
  const res = await upload(new Blob([jpeg], { type: 'image/jpeg' }), 'x.jpg', { auth: false });
  assert.equal(res.status, 401);
});

test('upload refuse : fichier trop volumineux -> 400', async () => {
  const big = new Uint8Array(4 * 1024 * 1024); // 4 Mo > limite 3 Mo
  const res = await upload(new Blob([big], { type: 'image/jpeg' }), 'gros.jpg');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'UPLOAD_ERROR');
});

async function uploadPoster(eventId, blob, filename) {
  const fd = new FormData();
  fd.append('image', blob, filename);
  const res = await fetch(
    `http://127.0.0.1:${server.address().port}/api/events/${eventId}/main-image`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: fd,
    },
  );
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

test('affiche : upload haute qualite, format preserve, remplacement et suppression', async () => {
  const created = await api.post('/events', {
    category: 'mariage',
    title: 'Affiche de test',
    date: '2026-09-01',
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.data.event._id;

  const png = await sharp({
    create: {
      width: 1200,
      height: 1800,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const res = await uploadPoster(id, new Blob([png], { type: 'image/png' }), 'affiche.png');
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const mainImage = res.body.data.event.mainImage;
  assert.ok(mainImage.url.includes('/uploads/'), 'affiche stockee en local');
  assert.ok(mainImage.url.endsWith('.png'), 'format PNG preserve');

  // Remplacement : l'ancien fichier est supprime du disque
  const oldPublicId = mainImage.publicId;
  const jpeg = await sharp({
    create: { width: 800, height: 1200, channels: 3, background: { r: 20, g: 20, b: 20 } },
  })
    .jpeg()
    .toBuffer();
  const replaced = await uploadPoster(id, new Blob([jpeg], { type: 'image/jpeg' }), 'affiche.jpg');
  assert.equal(replaced.status, 201, JSON.stringify(replaced.body));
  assert.ok(replaced.body.data.event.mainImage.url.endsWith('.jpeg'), 'format JPEG preserve');
  const files = await fs.readdir(uploadDir);
  assert.ok(!files.includes(oldPublicId), 'ancienne affiche supprimee');

  // Suppression
  const del = await api.delete(`/events/${id}/main-image`);
  assert.equal(del.status, 200);
  assert.equal(del.body.data.event.mainImage, undefined);

  await api.delete(`/events/${id}`);
});
