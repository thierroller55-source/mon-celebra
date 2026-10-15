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

/**
 * Les categories proviennent desormais de l'API (/api/categories).
 * Utiliser `categoryService.list()` ; plus de liste codee en dur.
 */
