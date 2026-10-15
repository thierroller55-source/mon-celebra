export const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

export const LANGUAGES = Object.freeze(['fr', 'en']);

export const EVENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  ARCHIVED: 'archived',
});

export const EVENT_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
  PASSWORD: 'password',
});

export const RSVP_RESPONSE = Object.freeze({
  YES: 'yes',
  NO: 'no',
  MAYBE: 'maybe',
});

export const GUESTBOOK_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const PLACE_TYPES = Object.freeze([
  'mosquee',
  'eglise',
  'salle_reception',
  'hotel',
  'domicile',
  'restaurant',
  'exterieur',
  'entreprise',
  'ecole_universite',
  'autre',
]);

export const PLACE_TYPE_LABELS = Object.freeze({
  mosquee: 'Mosquee',
  eglise: 'Eglise',
  salle_reception: 'Salle de reception',
  hotel: 'Hotel',
  domicile: 'Domicile',
  restaurant: 'Restaurant',
  exterieur: 'Espace exterieur',
  entreprise: 'Entreprise / Bureau',
  ecole_universite: 'Ecole / Universite',
  autre: 'Autre',
});

/**
 * Categories canoniques. Elles sont egalement inserees en base (collection
 * "categories") pour pouvoir etre gerees depuis le dashboard admin.
 * Les 3 premieres sont le MVP ; les suivantes sont preparees pour la phase 3.
 */
export const CATEGORIES = Object.freeze([
  { slug: 'mariage', name: 'Mariage', icon: 'heart', isMvp: true, order: 1 },
  { slug: 'anniversaire', name: 'Anniversaire', icon: 'cake', isMvp: true, order: 2 },
  { slug: 'bapteme', name: 'Bapteme', icon: 'baby', isMvp: true, order: 3 },
  { slug: 'graduation', name: 'Graduation', icon: 'graduation-cap', isMvp: false, order: 4 },
  { slug: 'fiancailles', name: 'Fiancailles', icon: 'gem', isMvp: false, order: 5 },
  { slug: 'baby-shower', name: 'Baby Shower', icon: 'baby', isMvp: false, order: 6 },
  { slug: 'soiree', name: 'Soiree', icon: 'party-popper', isMvp: false, order: 7 },
  { slug: 'inauguration', name: 'Inauguration', icon: 'home', isMvp: false, order: 8 },
  { slug: 'evenement-professionnel', name: 'Evenement professionnel', icon: 'briefcase', isMvp: false, order: 9 },
  { slug: 'commemoration', name: 'Commemoration', icon: 'dove', isMvp: false, order: 10 },
  { slug: 'autres', name: 'Autres evenements', icon: 'sparkles', isMvp: false, order: 11 },
]);

export const CATEGORY_SLUGS = Object.freeze(CATEGORIES.map((c) => c.slug));

export const DEFAULT_DESIGN = Object.freeze({
  primaryColor: '#B08D57',
  secondaryColor: '#1F2937',
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  background: '#FFFFFF',
});

export const QUOTAS = Object.freeze({
  MAX_ACTIVE_EVENTS: 3,
  MAX_GALLERY_PHOTOS: 20,
  MAX_FILE_SIZE_MB: 3,
});

export const ALLOWED_IMAGE_MIME = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_IMAGE_EXT = Object.freeze(['.jpg', '.jpeg', '.png', '.webp']);
