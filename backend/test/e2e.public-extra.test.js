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

async function makePublishedEvent(api, overrides = {}) {
  const res = await api.post('/events', {
    category: 'graduation',
    title: overrides.title || 'Evenement public',
    details: { graduateName: 'Awa Diop' },
    ...overrides,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const event = res.body.data.event;
  const pub = await api.post(`/events/${event._id}/publish`);
  assert.equal(pub.status, 200);
  return pub.body.data.event;
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

test('GET /health et HEAD /health', async () => {
  const get = await fetch(`${baseUrl}/health`);
  assert.equal(get.status, 200);
  const body = await get.json();
  assert.equal(body.status, 'ok');

  const head = await fetch(`${baseUrl}/health`, { method: 'HEAD' });
  assert.equal(head.status, 204);
});

test('GET /templates : filtre par categorie', async () => {
  const api = createApiClient(baseUrl);
  const all = await api.get('/templates');
  assert.equal(all.status, 200);
  assert.ok(Array.isArray(all.body.data.templates));
  assert.ok(all.body.data.templates.length > 0);

  const filtered = await api.get('/templates?category=graduation');
  assert.equal(filtered.status, 200);
  for (const t of filtered.body.data.templates) {
    assert.equal(t.categorySlug, 'graduation');
  }
});

test('GET /geo/search : requete trop longue -> 400, courte -> [] sans reseau', async () => {
  const api = createApiClient(baseUrl);

  const long = await api.get(`/geo/search?q=${'a'.repeat(201)}`);
  assert.equal(long.status, 400);

  const short = await api.get('/geo/search?q=a');
  assert.equal(short.status, 200);
  assert.deepEqual(short.body.data.results, []);
});

test('GET /geo/resolve-link : extrait les coordonnees d\'un lien Google Maps', async () => {
  const api = createApiClient(baseUrl);

  const missing = await api.get('/geo/resolve-link');
  assert.equal(missing.status, 400);

  const badHost = await api.get('/geo/resolve-link?url=https://example.com/foo');
  assert.equal(badHost.status, 400);

  const maps =
    'https://www.google.com/maps/place/UCAD/@14.6928,-17.4467,17z/data=!3m1!4b1';
  const ok = await api.get(`/geo/resolve-link?url=${encodeURIComponent(maps)}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.lat, 14.6928);
  assert.equal(ok.body.data.lng, -17.4467);
});

test('POST /reports : signale un evenement existant', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(host);

  const guest = createApiClient(baseUrl);
  const ok = await guest.post('/reports', {
    eventId: event._id,
    reason: 'Contenu inapproprie signale.',
    reporterEmail: 'temoin@example.com',
  });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));

  const unknown = await guest.post('/reports', {
    eventId: '64b7f9f9f9f9f9f9f9f9f9f9',
    reason: 'Signalement fantome.',
  });
  assert.equal(unknown.status, 404);

  const invalid = await guest.post('/reports', { eventId: 'x', reason: 'ok' });
  assert.equal(invalid.status, 400);
});

test('GET /public/events/:slug/calendar.ics : export iCalendar', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(api, { title: 'Agenda' });

  const res = await fetch(`${baseUrl}/public/events/${event.slug}/calendar.ics`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/calendar/);
  const text = await res.text();
  assert.match(text, /BEGIN:VCALENDAR/);
});

test('GET /public/events/:slug/calendar.ics : evenement non publie -> 404', async () => {
  const { api } = await createUserClient(baseUrl);
  const created = await api.post('/events', {
    category: 'graduation',
    title: 'Brouillon',
    details: { graduateName: 'X' },
  });
  const slug = created.body.data.event.slug;

  const res = await fetch(`${baseUrl}/public/events/${slug}/calendar.ics`);
  assert.equal(res.status, 404);
});

test('POST /public/events/:slug/rsvp : session invite -> 403 ACCOUNT_REQUIRED', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(host);

  const guest = createApiClient(baseUrl);
  const session = await guest.post('/auth/guest');
  guest.setToken(session.body.data.accessToken);

  const res = await guest.post(`/public/events/${event.slug}/rsvp`, { response: 'yes' });
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'ACCOUNT_REQUIRED');
});

test('POST /public/events/:slug/rsvp : non authentifie -> 401', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(host);

  const anon = createApiClient(baseUrl);
  const res = await anon.post(`/public/events/${event.slug}/rsvp`, { response: 'yes' });
  assert.equal(res.status, 401);
});

test('POST /public/events/:slug/rsvp : mise a jour n\'additionne pas les stats', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const event = await makePublishedEvent(host, { title: 'Stats RSVP' });

  const visitor = await createUserClient(baseUrl);
  await visitor.api.post(`/public/events/${event.slug}/rsvp`, { response: 'yes', guestsCount: 1 });
  await visitor.api.post(`/public/events/${event.slug}/rsvp`, { response: 'no', guestsCount: 1 });

  const pub = await visitor.api.get(`/public/events/${event.slug}`);
  assert.equal(pub.body.data.event.stats.rsvpYes, 0);
  assert.equal(pub.body.data.event.stats.rsvpNo, 1);
});
