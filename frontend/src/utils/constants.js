export const EVENT_STATUS_LABELS = {
  draft: 'Brouillon',
  published: 'Publie',
  unpublished: 'Depublie',
  archived: 'Archive',
};

export const VISIBILITY_LABELS = {
  public: 'Public',
  private: 'Prive (lien)',
  password: 'Protege par mot de passe',
};

export const PLACE_TYPES = [
  { value: 'mosquee', label: 'Mosquee' },
  { value: 'eglise', label: 'Eglise' },
  { value: 'salle_reception', label: 'Salle de reception' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'domicile', label: 'Domicile' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'exterieur', label: 'Espace exterieur' },
  { value: 'entreprise', label: 'Entreprise / Bureau' },
  { value: 'ecole_universite', label: 'Ecole / Universite' },
  { value: 'autre', label: 'Autre' },
];

export const MVP_CATEGORIES = [
  { slug: 'mariage', name: 'Mariage', emoji: '\u{1F48D}' },
  { slug: 'anniversaire', name: 'Anniversaire', emoji: '\u{1F382}' },
  { slug: 'bapteme', name: 'Bapteme', emoji: '\u{1F476}' },
];

export const FUTURE_CATEGORIES = [
  { slug: 'graduation', name: 'Graduation' },
  { slug: 'fiancailles', name: 'Fiancailles' },
  { slug: 'baby-shower', name: 'Baby Shower' },
  { slug: 'soiree', name: 'Soiree' },
  { slug: 'inauguration', name: 'Inauguration' },
  { slug: 'professionnel', name: 'Evenement professionnel' },
  { slug: 'commemoration', name: 'Commemoration' },
];
