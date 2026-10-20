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

async function createEvent(api, overrides = {}) {
  const res = await api.post('/events', {
    category: 'graduation',
    title: overrides.title || 'Evenement hote',
    details: overrides.details || { graduateName: 'Awa Diop' },
    ...overrides,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.event;
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

test('GET /events : liste les evenements du proprietaire uniquement', async () => {
  const { api } = await createUserClient(baseUrl);
  await createEvent(api, { title: 'Evenement Un' });
  await createEvent(api, { title: 'Evenement Deux' });

  const list = await api.get('/events');
  assert.equal(list.status, 200);
  assert.equal(list.body.data.events.length, 2);

  const other = await createUserClient(baseUrl);
  const otherList = await other.api.get('/events');
  assert.equal(otherList.status, 200);
  assert.equal(otherList.body.data.events.length, 0);
});

test('POST /:id/unpublish : repasse un evenement publie en non publie', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await createEvent(api);

  const published = await api.post(`/events/${event._id}/publish`);
  assert.equal(published.status, 200);
  assert.equal(published.body.data.event.status, 'published');

  const unpublished = await api.post(`/events/${event._id}/unpublish`);
  assert.equal(unpublished.status, 200);
  assert.equal(unpublished.body.data.event.status, 'unpublished');

  const publicRes = await api.get(`/public/events/${event.slug}`);
  assert.equal(publicRes.status, 404);
  assert.equal(publicRes.body.code, 'EVENT_NOT_PUBLISHED');
});

test('POST /:id/duplicate : cree une copie en brouillon avec un nouveau slug', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await createEvent(api, { title: 'Original' });
  await api.post(`/events/${event._id}/publish`);

  const dup = await api.post(`/events/${event._id}/duplicate`);
  assert.equal(dup.status, 201);
  const copy = dup.body.data.event;
  assert.equal(copy.status, 'draft');
  assert.equal(copy.title, 'Original (copie)');
  assert.notEqual(copy.slug, event.slug);
  assert.equal(copy.category, event.category);
});

test('POST /:id/archive puis /:id/unarchive', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await createEvent(api);

  const archived = await api.post(`/events/${event._id}/archive`);
  assert.equal(archived.status, 200);
  assert.equal(archived.body.data.event.status, 'archived');

  const unarchived = await api.post(`/events/${event._id}/unarchive`);
  assert.equal(unarchived.status, 200);
  assert.equal(unarchived.body.data.event.status, 'draft');
});

test('GET /:id/qrcode : renvoie un PNG inline ou en telechargement', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await createEvent(api);

  const raw = await fetch(`${baseUrl}/events/${event._id}/qrcode`, {
    headers: { Authorization: `Bearer ${api.getToken()}` },
  });
  assert.equal(raw.status, 200);
  assert.equal(raw.headers.get('content-type'), 'image/png');
  assert.match(raw.headers.get('content-disposition'), /inline/);

  const dl = await fetch(`${baseUrl}/events/${event._id}/qrcode?download=1`, {
    headers: { Authorization: `Bearer ${api.getToken()}` },
  });
  assert.equal(dl.status, 200);
  assert.match(dl.headers.get('content-disposition'), /attachment/);
});

test('GET /:id/poster : 404 si aucune affiche', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await createEvent(api);

  const res = await api.get(`/events/${event._id}/poster`);
  assert.equal(res.status, 404);
  assert.equal(res.body.code, 'NO_POSTER');
});

test('DELETE /:id/photos/:photoId : photo inexistante -> 404', async () => {
  const { api } = await createUserClient(baseUrl);
  const event = await createEvent(api);

  const res = await api.delete(`/events/${event._id}/photos/64b7f9f9f9f9f9f9f9f9f9f9`);
  assert.equal(res.status, 404);
});

test('RSVP hote : liste, acceptation/refus et export CSV', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const event = await createEvent(host, { title: 'Fete RSVP' });
  await host.post(`/events/${event._id}/publish`);

  const visitor = await createUserClient(baseUrl, { firstName: 'Moussa', lastName: 'Fall' });
  const rsvp = await visitor.api.post(`/public/events/${event.slug}/rsvp`, {
    response: 'yes',
    guestsCount: 2,
    message: 'Avec plaisir',
  });
  assert.equal(rsvp.status, 201, JSON.stringify(rsvp.body));
  const rsvpId = rsvp.body.data.rsvp._id;
  assert.equal(rsvp.body.data.rsvp.name, 'Moussa Fall');
  assert.equal(rsvp.body.data.rsvp.email, visitor.email);

  const list = await host.get(`/events/${event._id}/rsvp`);
  assert.equal(list.status, 200);
  assert.equal(list.body.data.rsvps.length, 1);
  assert.equal(list.body.data.rsvps[0].hostResponse, null);

  const reply = await host.patch(`/events/${event._id}/rsvp/${rsvpId}/reply`, {
    hostResponse: 'accepted',
  });
  assert.equal(reply.status, 200);
  assert.equal(reply.body.data.rsvp.hostResponse, 'accepted');

  // Le visiteur voit la reponse de l'hote via la page publique + /my-rsvp.
  const myRsvp = await visitor.api.get(`/public/events/${event.slug}/my-rsvp`);
  assert.equal(myRsvp.status, 200);
  assert.equal(myRsvp.body.data.rsvp.hostResponse, 'accepted');

  const pub = await visitor.api.get(`/public/events/${event.slug}`);
  assert.equal(pub.status, 200);
  assert.equal(pub.body.data.event.myRsvp.hostResponse, 'accepted');

  // Notification au visiteur.
  const notif = await visitor.api.get('/notifications');
  assert.equal(notif.status, 200);
  assert.equal(notif.body.data.notifications.length, 1);

  // Export CSV.
  const csv = await fetch(`${baseUrl}/events/${event._id}/rsvp/export`, {
    headers: { Authorization: `Bearer ${host.getToken()}` },
  });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  const text = await csv.text();
  assert.match(text, /Moussa Fall/);
  assert.match(text, /accepted/);
});

test('RSVP hote : reponse invalide -> 400', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const event = await createEvent(host);
  await host.post(`/events/${event._id}/publish`);
  const visitor = await createUserClient(baseUrl);
  const rsvp = await visitor.api.post(`/public/events/${event.slug}/rsvp`, { response: 'yes' });

  const res = await host.patch(`/events/${event._id}/rsvp/${rsvp.body.data.rsvp._id}/reply`, {
    hostResponse: 'peut-etre',
  });
  assert.equal(res.status, 400);
});

test('Livre d\'or hote : moderation puis suppression', async () => {
  const { api: host } = await createUserClient(baseUrl);
  const event = await createEvent(host, { title: 'Livre d or' });
  await host.post(`/events/${event._id}/publish`);

  const guest = createApiClient(baseUrl);
  const msg = await guest.post(`/public/events/${event.slug}/guestbook`, {
    authorName: 'Tante Awa',
    message: 'Toutes mes felicitations !',
  });
  assert.equal(msg.status, 201, JSON.stringify(msg.body));
  const msgId = msg.body.data.message._id;
  assert.equal(msg.body.data.message.status, 'pending');

  const list = await host.get(`/events/${event._id}/guestbook`);
  assert.equal(list.status, 200);
  assert.equal(list.body.data.messages.length, 1);

  const approved = await host.patch(`/events/${event._id}/guestbook/${msgId}`, {
    status: 'approved',
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.data.message.status, 'approved');

  const pub = await guest.get(`/public/events/${event.slug}`);
  assert.equal(pub.body.data.event.guestbook.length, 1);

  const del = await host.delete(`/events/${event._id}/guestbook/${msgId}`);
  assert.equal(del.status, 200);

  const empty = await host.get(`/events/${event._id}/guestbook`);
  assert.equal(empty.body.data.messages.length, 0);
});
