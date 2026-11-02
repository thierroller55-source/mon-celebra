import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { seedCatalog } from './helpers/seed.js';
import { createUserClient } from './helpers/accounts.js';

const BOT_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const HUMAN_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

let server;
let baseUrl;

async function makePublishedEvent(api, overrides = {}) {
  const res = await api.post('/events', {
    category: 'graduation',
    title: overrides.title || 'Evenement partage',
    details: { graduateName: 'Awa Diop' },
    ...overrides,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const event = res.body.data.event;
  const pub = await api.post(`/events/${event._id}/publish`);
  assert.equal(pub.status, 200, JSON.stringify(pub.body));
  return pub.body.data.event;
}

function fetchShare(slug, userAgent) {
  return fetch(`${baseUrl}/share/e/${slug}`, {
    headers: { 'user-agent': userAgent },
    redirect: 'manual',
  });
}

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

test('robot social : Open Graph complet pour un evenement public', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(api, {
    title: 'Mariage de Fatou',
    tagline: 'Venez celebrer avec nous',
    language: 'en',
  });
  const pageUrl = `${env.clientUrl}/en/e/${event.slug}`;

  const res = await fetchShare(event.slug, BOT_UA);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/html/);

  const html = await res.text();
  assert.ok(html.includes('<meta property="og:title" content="Mariage de Fatou">'));
  assert.ok(html.includes('<meta property="og:description" content="Venez celebrer avec nous">'));
  assert.ok(html.includes(`<meta property="og:url" content="${pageUrl}">`));
  assert.ok(html.includes('<meta property="og:locale" content="en_US">'));
  assert.ok(html.includes(`<link rel="canonical" href="${pageUrl}">`));
  assert.ok(html.includes('<meta name="robots" content="index, follow">'));
  assert.ok(html.includes('<meta name="twitter:card" content="summary">'));
});

test('robot social : le titre est echappe (pas d injection HTML)', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(api, {
    title: 'Fete <script>alert("x")</script> & Cie',
  });

  const res = await fetchShare(event.slug, 'WhatsApp/2.23');
  assert.equal(res.status, 200);

  const html = await res.text();
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&amp; Cie'));
});

test('robot social : evenement prive ou protege -> apercu neutre sans fuite', async () => {
  const cases = [
    { title: 'Anniversaire prive', visibility: 'private' },
    { title: 'Mariage secret', visibility: 'password', accessCode: '1234' },
  ];

  for (const overrides of cases) {
    const { api } = await createUserClient(baseUrl);
    const event = await makePublishedEvent(api, overrides);
    const res = await fetchShare(event.slug, BOT_UA);
    assert.equal(res.status, 200);

    const html = await res.text();
    assert.ok(!html.includes(overrides.title), `titre fuite : ${overrides.title}`);
    assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'));
    assert.ok(!html.includes('property="og:image"'));
  }
});

test('robot social : evenement non publie ou inconnu -> 404 noindex', async () => {
  const { api } = await createUserClient(baseUrl);
  const created = await api.post('/events', {
    category: 'graduation',
    title: 'Brouillon pas publie',
    details: { graduateName: 'Awa Diop' },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));

  for (const slug of [created.body.data.event.slug, 'slug-inexistant-xyz']) {
    const res = await fetchShare(slug, BOT_UA);
    assert.equal(res.status, 404);
    const html = await res.text();
    assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'));
    assert.ok(!html.includes('Brouillon pas publie'));
  }
});

test('navigateur : redirection vers la page publique de la SPA', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(api, { title: 'Redirection', language: 'wo' });
  const pageUrl = `${env.clientUrl}/wo/e/${event.slug}`;

  const res = await fetchShare(event.slug, HUMAN_UA);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), pageUrl);
});
