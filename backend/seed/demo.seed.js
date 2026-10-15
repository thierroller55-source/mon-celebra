import { User } from '../src/models/User.js';
import { Event } from '../src/models/Event.js';
import { Rsvp } from '../src/models/Rsvp.js';
import { GuestbookMessage } from '../src/models/GuestbookMessage.js';
import { ROLES, EVENT_STATUS, EVENT_VISIBILITY, RSVP_RESPONSE, GUESTBOOK_STATUS } from '../src/config/constants.js';

/**
 * Donnees de DEMONSTRATION uniquement. Tous les documents crees ici sont
 * marques `details.isDemo = true` (evenements) ou `isDemo` via email
 * `@demo.moncelebra.local` (utilisateurs) pour pouvoir les purger.
 */
const DEMO_PASSWORD = 'Demo1234!';

const DEMO_USERS = [
  { firstName: 'Admin', lastName: 'Celebra', email: 'admin@demo.moncelebra.local', role: ROLES.ADMIN },
  { firstName: 'Awa', lastName: 'Diop', email: 'demo@demo.moncelebra.local', role: ROLES.USER },
];

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function upsertUser(data) {
  const passwordHash = await User.hashPassword(DEMO_PASSWORD);
  return User.findOneAndUpdate(
    { email: data.email },
    {
      $set: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        role: data.role,
        language: 'fr',
        isActive: true,
        emailVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

const DEMO_EVENTS = [
  {
    slug: 'demo-mariage-awa-moussa',
    category: 'mariage',
    title: 'Mariage de Awa & Moussa',
    tagline: 'Deux coeurs, une histoire',
    description:
      'Nous avons la joie de vous convier a la celebration de notre union. Votre presence sera notre plus beau cadeau.',
    date: daysFromNow(60),
    startTime: '16:00',
    endTime: '23:00',
    location: {
      label: 'Ceremonie',
      type: 'mosquee',
      name: 'Grande Mosquee de Dakar',
      address: 'Avenue Pape Gueye Fall, Dakar',
      latitude: 14.6795,
      longitude: -17.4412,
    },
    locations: [
      {
        label: 'Reception',
        type: 'salle_reception',
        name: 'Salle Teranga',
        address: 'Route de la Corniche, Dakar',
        latitude: 14.6742,
        longitude: -17.4385,
        time: '19:00',
      },
    ],
    design: { primaryColor: '#B08D57', secondaryColor: '#1F2937', customTexts: { headline: 'Awa & Moussa', subtitle: '16 heures' } },
    program: [
      { time: '16:00', title: 'Ceremonie religieuse', description: 'Grande Mosquee de Dakar' },
      { time: '19:00', title: 'Cocktail', description: 'Salle Teranga' },
      { time: '20:30', title: 'Diner & Dance' },
    ],
    stats: { views: 128, rsvpYes: 42, rsvpNo: 3, rsvpMaybe: 5 },
  },
  {
    slug: 'demo-anniversaire-fatou-10-ans',
    category: 'anniversaire',
    title: 'Les 10 ans de Fatou',
    tagline: 'Une decennie de bonheur',
    description: 'Rejoignez-nous pour souffler les bougies et partager un moment joyeux en famille.',
    date: daysFromNow(21),
    startTime: '15:00',
    endTime: '19:00',
    location: {
      label: 'Fete',
      type: 'domicile',
      name: 'Residence des Diop',
      address: 'Sacre-Coeur 3, Dakar',
      latitude: 14.7167,
      longitude: -17.4677,
    },
    locations: [],
    design: { primaryColor: '#F97316', secondaryColor: '#7C2D12', customTexts: { headline: 'Fatou 10 ans', subtitle: 'Viens nombreux !' } },
    program: [
      { time: '15:00', title: 'Accueil des invites' },
      { time: '16:00', title: 'Gouter' },
      { time: '17:30', title: 'Jeux & animations' },
    ],
    stats: { views: 64, rsvpYes: 18, rsvpNo: 1, rsvpMaybe: 2 },
  },
];

async function upsertEvent(ownerId, data) {
  return Event.findOneAndUpdate(
    { slug: data.slug },
    {
      $set: {
        ownerId,
        category: data.category,
        slug: data.slug,
        title: data.title,
        tagline: data.tagline,
        description: data.description,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: 'Africa/Dakar',
        location: data.location,
        locations: data.locations,
        design: data.design,
        program: data.program,
        visibility: EVENT_VISIBILITY.PUBLIC,
        status: EVENT_STATUS.PUBLISHED,
        publishedAt: new Date(),
        settings: { rsvpEnabled: true, guestbookEnabled: true, guestbookModeration: true, countdownEnabled: true },
        stats: data.stats,
        details: { isDemo: true },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedDemoInteractions(event) {
  const existingRsvp = await Rsvp.countDocuments({ eventId: event._id });
  if (existingRsvp === 0) {
    await Rsvp.insertMany([
      { eventId: event._id, name: 'Cheikh Fall', phone: '+221771234567', guestsCount: 2, response: RSVP_RESPONSE.YES, message: 'Avec grand plaisir !' },
      { eventId: event._id, name: 'Mariama Ba', guestsCount: 1, response: RSVP_RESPONSE.MAYBE, message: 'Je confirme bientot.' },
      { eventId: event._id, name: 'Ousmane Ndiaye', guestsCount: 4, response: RSVP_RESPONSE.YES },
    ]);
  }

  const existingMessages = await GuestbookMessage.countDocuments({ eventId: event._id });
  if (existingMessages === 0) {
    await GuestbookMessage.insertMany([
      { eventId: event._id, authorName: 'Cheikh Fall', message: 'Tous mes voeux de bonheur !', status: GUESTBOOK_STATUS.APPROVED },
      { eventId: event._id, authorName: 'Mariama Ba', message: 'Que Dieu benisse votre union.', status: GUESTBOOK_STATUS.APPROVED },
    ]);
  }
}

export async function seedDemo() {
  const admin = await upsertUser(DEMO_USERS[0]);
  const owner = await upsertUser(DEMO_USERS[1]);

  const events = [];
  for (const data of DEMO_EVENTS) {
    const event = await upsertEvent(owner._id, data);
    await seedDemoInteractions(event);
    events.push(event);
  }

  return {
    users: [admin.email, owner.email],
    password: DEMO_PASSWORD,
    events: events.map((e) => e.slug),
  };
}
