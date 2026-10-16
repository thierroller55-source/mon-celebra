import './helpers/mongo.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { createApiClient } from './helpers/api.js';
import { seedCatalog } from './helpers/seed.js';
import { connectTestDB, disconnectTestDB, stopMongo } from './helpers/mongo.js';

let server;
let api;

const img = (name) => ({ url: `https://images.example.com/${name}.webp`, publicId: name });

/**
 * Jeu de donnees representatif couvrant tous les types de champs des
 * 11 categories (text, date, number, boolean, select, image, gallery, list,
 * program, contacts, links, speakers, sections).
 */
const SAMPLES = {
  mariage: {
    groomName: 'Ibrahima',
    brideName: 'Aminata',
    timeline: [{ time: '10:00', title: 'Ceremonie', description: 'Echange des voeux' }],
    dressCode: 'Elegant',
    practicalInfo: 'Parking disponible sur place.',
    giftList: ['Service de table', 'Linge de maison'],
    contacts: [{ label: 'Telephone', value: '+221771234567' }],
  },
  anniversaire: {
    celebrantName: 'Moussa',
    age: 30,
    theme: 'Annees 80',
    celebrantPhoto: img('moussa'),
    wishlist: ['Voyage', 'Livre'],
    isSurprise: true,
    contacts: [{ label: 'WhatsApp', value: '+221781112233' }],
  },
  bapteme: {
    babyName: 'Fatou',
    nameMeaning: 'Bien nee',
    birthDate: '2026-01-15',
    babyPhoto: img('fatou'),
    parents: ['Ibrahima', 'Aminata'],
    godparents: ['Ali', 'Sara'],
    parentsMessage: 'Merci pour votre presence.',
  },
  graduation: {
    graduateName: 'Awa Diop',
    diploma: 'Master en informatique',
    fieldOfStudy: 'Genie logiciel',
    institution: 'UCAD',
    promotion: 'Promotion 2026',
    graduatePhoto: img('awa'),
    thankYouMessage: 'Merci a tous.',
    contacts: [{ label: 'Telephone', value: '+221771234567' }],
  },
  fiancailles: {
    partner1Name: 'Awa',
    partner2Name: 'Moussa',
    couplePhotos: [img('couple1'), img('couple2')],
    ceremonyType: 'moderne',
    story: 'Nous nous sommes rencontres en 2019.',
    invitationMessage: 'Rejoignez-nous.',
    contacts: [{ label: 'Telephone', value: '+221771234567' }],
  },
  'baby-shower': {
    parentsNames: 'Awa et Moussa',
    parentsPhoto: img('parents'),
    babyName: 'Bebe',
    parentsMessage: 'Nous vous attendons.',
    practicalInfo: 'A partir de 15h.',
    giftList: ['Couches', 'Body'],
  },
  soiree: {
    partyType: 'concert',
    poster: img('poster'),
    organizer: 'Luna Events',
    artists: ['DJ X', 'Chanteur Y'],
    dressCode: 'Chic',
    minAge: 18,
    maxCapacity: 500,
    ticketsInfo: 'Billets disponibles en ligne.',
    contacts: [{ label: 'Billetterie', value: '+221771234567' }],
  },
  inauguration: {
    establishmentName: 'Boutique Awa',
    establishmentType: 'commerce',
    activityDescription: 'Vente de vetements.',
    organizerName: 'Awa',
    logo: img('logo'),
    coverImage: img('cover'),
    website: 'https://boutique-awa.example.com',
    socials: [{ label: 'Instagram', url: 'https://instagram.com/awa' }],
    practicalInfo: 'Ouverture a 10h.',
    contacts: [{ label: 'Telephone', value: '+221771234567' }],
  },
  'evenement-professionnel': {
    professionalType: 'conference',
    companyName: 'TechCorp',
    companyLogo: img('techcorp'),
    coverImage: img('conf'),
    participationType: 'hybride',
    visioLink: 'https://meet.example.com/conf',
    speakers: [{ name: 'Dr Diallo', bio: 'Expert IA', photo: img('diallo') }],
    maxCapacity: 200,
    conditions: 'Inscription obligatoire.',
    pricing: 'Gratuit pour les etudiants.',
    website: 'https://techcorp.example.com',
    contacts: [{ label: 'Email', value: 'contact@techcorp.example.com' }],
  },
  commemoration: {
    commemoratedName: 'Papa',
    commemoratedPhoto: img('papa'),
    importantDates: ['1950-01-01', '2020-05-05'],
    tributeMessage: 'Ton souvenir reste vivant.',
    commemorativeText: 'Une vie de courage.',
    organizerName: 'La famille',
    practicalInfo: 'Ceremonie a 9h.',
    contacts: [{ label: 'Telephone', value: '+221771234567' }],
  },
  autres: {
    customSubType: 'Fete de quartier',
    organizerName: 'Comite de quartier',
    practicalInfo: 'Tout public.',
    sections: [{ title: 'Programme', content: 'Animation et restauration.' }],
    contacts: [{ label: 'Telephone', value: '+221771234567' }],
  },
};

test.before(async () => {
  await connectTestDB();
  await seedCatalog();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  api = createApiClient(`http://127.0.0.1:${server.address().port}/api`);
  const guest = await api.post('/auth/guest');
  api.setToken(guest.body.data.accessToken);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
  await stopMongo();
});

for (const slug of Object.keys(SAMPLES)) {
  test(`categorie ${slug} : creation, persistance des details et page publique`, async () => {
    const details = SAMPLES[slug];
    const created = await api.post('/events', {
      category: slug,
      title: `Evenement ${slug}`,
      date: '2026-09-01',
      startTime: '18:00',
      endTime: '22:00',
      visibility: 'public',
      location: {
        name: 'Lieu de test',
        address: 'Dakar, Senegal',
        latitude: 14.69,
        longitude: -17.44,
      },
      details,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const event = created.body.data.event;

    // Persistance integrale des details
    const fetched = await api.get(`/events/${event._id}`);
    assert.equal(fetched.status, 200);
    assert.deepEqual(fetched.body.data.event.details, details);

    // Publication + restitution publique
    const published = await api.post(`/events/${event._id}/publish`);
    assert.equal(published.status, 200, JSON.stringify(published.body));
    const publicRes = await api.get(`/public/events/${event.slug}`);
    assert.equal(publicRes.status, 200);
    assert.deepEqual(publicRes.body.data.event.details, details);

    // Nettoyage (respect du quota de 3 evenements actifs)
    const removed = await api.delete(`/events/${event._id}`);
    assert.equal(removed.status, 200);
  });
}
