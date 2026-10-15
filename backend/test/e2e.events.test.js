import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { CATEGORY_FIELDS } from '../src/config/categoryFields.js';
import { seedCatalog } from './helpers/seed.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';

let server;
let baseUrl;
let token;

const REQUIRED_DETAILS = {
  graduation: { graduateName: 'Awa Diop' },
  fiancailles: { partner1Name: 'Awa' },
  inauguration: { establishmentName: 'Boutique Awa' },
  'evenement-professionnel': { participationType: 'presentiel' },
  commemoration: { commemoratedName: 'Papa' },
};

async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
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

test('flux complet : guest, 11 categories, validation, publication', async () => {
  // 1. Session invite
  const guest = await api('/auth/guest', { method: 'POST', body: '{}' });
  assert.ok(guest.status === 200 || guest.status === 201, `guest status ${guest.status}`);
  token = guest.body.data.accessToken;
  assert.ok(token);

  // 2. Les 11 categories exposees avec leur schema de champs
  const categories = await api('/categories');
  assert.equal(categories.status, 200);
  const slugs = categories.body.data.categories.map((c) => c.slug);
  assert.deepEqual(
    slugs.sort(),
    Object.keys(CATEGORY_FIELDS).sort(),
  );
  for (const category of categories.body.data.categories) {
    assert.ok(Array.isArray(category.fieldsSchema.fields));
  }

  // 3. Creation valide pour chaque categorie, puis suppression (quota)
  for (const slug of Object.keys(CATEGORY_FIELDS)) {
    const created = await api('/events', {
      method: 'POST',
      body: JSON.stringify({
        category: slug,
        title: `Test ${slug}`,
        details: REQUIRED_DETAILS[slug] || {},
      }),
    });
    assert.equal(created.status, 201, `creation ${slug} : ${JSON.stringify(created.body)}`);
    const event = created.body.data.event;
    assert.equal(event.category, slug);

    await api(`/events/${event._id}`, { method: 'DELETE' });
  }

  // 4. Champ requis manquant -> 400
  const invalid = await api('/events', {
    method: 'POST',
    body: JSON.stringify({ category: 'graduation', title: 'Sans nom', details: {} }),
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.code, 'VALIDATION_ERROR');

  // 5. Publication + page publique avec details + template
  const created = await api('/events', {
    method: 'POST',
    body: JSON.stringify({
      category: 'graduation',
      title: 'E2E Public',
      details: { graduateName: 'Moussa', institution: 'UCAD' },
    }),
  });
  const event = created.body.data.event;

  const published = await api(`/events/${event._id}/publish`, { method: 'POST' });
  assert.equal(published.status, 200);

  const publicRes = await api(`/public/events/${event.slug}`);
  assert.equal(publicRes.status, 200);
  assert.equal(publicRes.body.data.event.details.graduateName, 'Moussa');
  assert.equal(publicRes.body.data.event.details.institution, 'UCAD');

  // 6. Mise a jour des details
  const updated = await api(`/events/${event._id}`, {
    method: 'PUT',
    body: JSON.stringify({
      category: 'graduation',
      title: 'E2E Public v2',
      details: { graduateName: 'Moussa', diploma: 'Licence' },
    }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.event.details.diploma, 'Licence');

  // Nettoyage
  await api(`/events/${event._id}`, { method: 'DELETE' });
});
