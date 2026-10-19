import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { createApiClient } from './helpers/api.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';
import { seedCatalog } from './helpers/seed.js';

let server;
let api;

test.before(async () => {
  await connectTestDB();
  await seedCatalog();
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

const FULL_DETAILS = {
  graduateName: 'Awa Diop',
  diploma: 'Master en informatique',
  fieldOfStudy: 'Genie logiciel',
  institution: 'UCAD',
  promotion: 'Promotion 2026',
  graduatePhoto: { url: 'https://images.example.com/awa.webp', publicId: 'awa-webp' },
  thankYouMessage: 'Merci a tous ceux qui m ont soutenu.',
  contacts: [{ label: 'Telephone', value: '+221771234567' }],
};

test('parcours complet Graduation : creation, persistance, publication, page publique', async () => {
  // 1. Session invite
  const guest = await api.post('/auth/guest');
  assert.ok([200, 201].includes(guest.status), `guest status ${guest.status}`);
  api.setToken(guest.body.data.accessToken);

  // 2. Catalogue : la categorie graduation expose son schema de champs
  const list = await api.get('/categories');
  assert.equal(list.status, 200);
  const graduation = list.body.data.categories.find((c) => c.slug === 'graduation');
  assert.ok(graduation, 'categorie graduation presente');
  assert.ok(Array.isArray(graduation.fieldsSchema.fields));
  const nameField = graduation.fieldsSchema.fields.find((f) => f.key === 'graduateName');
  assert.equal(nameField.required, true);

  // 3. Endpoint detail categorie (prompt 13)
  const detail = await api.get('/categories/graduation');
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.category.slug, 'graduation');

  // 4. Champ requis manquant -> 400 (validation backend)
  const invalid = await api.post('/events', {
    category: 'graduation',
    title: 'Remise de diplome',
    details: { institution: 'UCAD' },
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.code, 'VALIDATION_ERROR');

  // 5. Creation complete
  const created = await api.post('/events', {
    category: 'graduation',
    title: 'Remise de diplome de Awa',
    description: 'Ceremonie de graduation.',
    date: '2026-07-10',
    startTime: '10:00',
    endTime: '13:00',
    location: {
      label: 'Ceremonie',
      type: 'ecole_universite',
      name: 'Amphitheatre UCAD',
      address: 'Avenue Cheikh Anta Diop, Dakar',
      latitude: 14.6937,
      longitude: -17.4441,
    },
    details: FULL_DETAILS,
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const event = created.body.data.event;
  assert.equal(event.category, 'graduation');
  assert.equal(event.status, 'draft');
  assert.ok(event.slug);

  // 6. Persistance des details et du lieu
  const fetched = await api.get(`/events/${event._id}`);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.data.event.details.graduateName, 'Awa Diop');
  assert.equal(fetched.body.data.event.details.institution, 'UCAD');
  assert.equal(fetched.body.data.event.location.name, 'Amphitheatre UCAD');

  // 7. Un brouillon n'est PAS expose publiquement (code distinct pour l'UI)
  const draftPublic = await api.get(`/public/events/${event.slug}`);
  assert.equal(draftPublic.status, 404);
  assert.equal(draftPublic.body.code, 'EVENT_NOT_PUBLISHED');

  const unknownPublic = await api.get('/public/events/evenement-inexistant-xyz');
  assert.equal(unknownPublic.status, 404);
  assert.equal(unknownPublic.body.code, 'EVENT_NOT_FOUND');

  // 8. Publication
  const published = await api.post(`/events/${event._id}/publish`);
  assert.equal(published.status, 200);
  assert.equal(published.body.data.event.status, 'published');

  // 9. Page publique : details restitues + stats vues
  const publicRes = await api.get(`/public/events/${event.slug}`);
  assert.equal(publicRes.status, 200);
  const publicEvent = publicRes.body.data.event;
  assert.equal(publicEvent.details.graduateName, 'Awa Diop');
  assert.equal(publicEvent.details.thankYouMessage, FULL_DETAILS.thankYouMessage);
  assert.ok(publicEvent.stats.views >= 1);

  // 10. Export agenda iCalendar
  const ics = await fetch(
    `http://127.0.0.1:${server.address().port}/api/public/events/${event.slug}/calendar.ics`,
  );
  assert.equal(ics.status, 200);
  const icsText = await ics.text();
  assert.match(icsText, /BEGIN:VCALENDAR/);
  assert.match(icsText, /SUMMARY:Remise de diplome de Awa/);

  // 11. RSVP + statistiques
  const rsvp = await api.post(`/public/events/${event.slug}/rsvp`, {
    name: 'Moussa',
    response: 'yes',
    guestsCount: 2,
  });
  assert.equal(rsvp.status, 201);
  const rsvpList = await api.get(`/events/${event._id}/rsvp`);
  assert.equal(rsvpList.status, 200);
  assert.equal(rsvpList.body.data.rsvps.length, 1);
  assert.equal(rsvpList.body.data.stats.rsvpYes, 1);

  // 12. Livre d'or : moderation
  const gb = await api.post(`/public/events/${event.slug}/guestbook`, {
    authorName: 'Fatou',
    message: 'Felicitations !',
  });
  assert.equal(gb.status, 201);
  const gbList = await api.get(`/events/${event._id}/guestbook`);
  const pending = gbList.body.data.messages.find((m) => m.authorName === 'Fatou');
  assert.equal(pending.status, 'pending');
  const approved = await api.patch(`/events/${event._id}/guestbook/${pending._id}`, {
    status: 'approved',
  });
  assert.equal(approved.status, 200);
  const publicAfter = await api.get(`/public/events/${event.slug}`);
  assert.ok(publicAfter.body.data.event.guestbook.some((m) => m.authorName === 'Fatou'));

  // 13. Mise a jour des details -> reflete sur la page publique
  const updated = await api.put(`/events/${event._id}`, {
    category: 'graduation',
    title: 'Remise de diplome de Awa v2',
    details: { ...FULL_DETAILS, diploma: 'Doctorat' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.event.details.diploma, 'Doctorat');
  const publicUpdated = await api.get(`/public/events/${event.slug}`);
  assert.equal(publicUpdated.body.data.event.details.diploma, 'Doctorat');

  // 14. Nettoyage
  const removed = await api.delete(`/events/${event._id}`);
  assert.equal(removed.status, 200);
});
