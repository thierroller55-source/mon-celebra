/**
 * Source de verite des champs specifiques a chaque categorie d'evenement.
 *
 * Chaque categorie decrit :
 *  - `label`, `emoji`, `description` : presentation (accueil, listes).
 *  - `templates` : noms de modeles graphiques disponibles.
 *  - `defaults`  : valeurs par defaut appliquees a la creation.
 *  - `fields`    : champs stockes dans `event.details`, rendus par le frontend
 *                  et valides par le backend (voir validators/event.schema.js).
 *
 * Ajouter une categorie = ajouter une entree ici + une entree dans CATEGORIES.
 * Aucun autre code n'a besoin d'etre reecrit.
 *
 * Types de champs supportes (rendus par un composant frontend reutilisable) :
 *  text, textarea, date, time, number, boolean, select, image, gallery,
 *  list, program, contacts, links, speakers, sections.
 */

export const FIELD_TYPES = Object.freeze([
  'text',
  'textarea',
  'date',
  'time',
  'number',
  'boolean',
  'select',
  'image',
  'gallery',
  'list',
  'program',
  'contacts',
  'links',
  'speakers',
  'sections',
]);

export const CATEGORY_FIELDS = Object.freeze({
  mariage: {
    label: 'Mariage',
    emoji: '\u{1F48D}',
    description: 'Invitation de mariage avec programme, lieux et galerie.',
    templates: ['Elegance doree', 'Romantique', 'Luxe', 'Moderne', 'Minimaliste', 'Traditionnel'],
    fields: [
      { key: 'groomName', type: 'text', label: 'Nom du marie', maxLength: 120 },
      { key: 'brideName', type: 'text', label: 'Nom de la mariee', maxLength: 120 },
      { key: 'timeline', type: 'program', label: 'Moments cles' },
      { key: 'dressCode', type: 'text', label: 'Code vestimentaire', maxLength: 160 },
      { key: 'practicalInfo', type: 'textarea', label: 'Informations pratiques' },
      { key: 'giftList', type: 'list', label: 'Liste de cadeaux' },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },

  anniversaire: {
    label: 'Anniversaire',
    emoji: '\u{1F382}',
    description: 'Fete d\'anniversaire avec theme, photos et liste de souhaits.',
    templates: ['Festif', 'Fete', 'Elegant', 'Moderne', 'Enfants'],
    fields: [
      { key: 'celebrantName', type: 'text', label: 'Nom de la personne fetee', maxLength: 120 },
      { key: 'age', type: 'number', label: 'Age' },
      { key: 'theme', type: 'text', label: 'Theme', maxLength: 120 },
      { key: 'wishlist', type: 'list', label: 'Liste de souhaits' },
      { key: 'isSurprise', type: 'boolean', label: 'Anniversaire surprise' },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },

  bapteme: {
    label: 'Bapteme',
    emoji: '\u{1F476}',
    description: 'Bapteme ou ceremonie religieuse de l\'enfant.',
    templates: ['Baby', 'Elegant', 'Minimaliste', 'Floral'],
    defaults: { visibility: 'private' },
    fields: [
      { key: 'babyName', type: 'text', label: 'Nom du bebe', maxLength: 120 },
      { key: 'nameMeaning', type: 'text', label: 'Signification du prenom', maxLength: 240 },
      { key: 'birthDate', type: 'date', label: 'Date de naissance' },
      { key: 'babyPhoto', type: 'image', label: 'Photo du bebe' },
      { key: 'parents', type: 'list', label: 'Parents' },
      { key: 'godparents', type: 'list', label: 'Parrain et marraine' },
      { key: 'parentsMessage', type: 'textarea', label: 'Message des parents' },
    ],
  },

  graduation: {
    label: 'Graduation',
    emoji: '\u{1F393}',
    description: 'Remise de diplome, promotion et felicitations.',
    templates: ['Moderne', 'Elegant', 'Academique', 'Minimaliste', 'Festif'],
    fields: [
      { key: 'graduateName', type: 'text', label: 'Nom complet du diplome', required: true, maxLength: 120 },
      { key: 'diploma', type: 'text', label: 'Diplome obtenu', maxLength: 160 },
      { key: 'fieldOfStudy', type: 'text', label: 'Filiere ou specialite', maxLength: 160 },
      { key: 'institution', type: 'text', label: 'Etablissement ou universite', maxLength: 160 },
      { key: 'promotion', type: 'text', label: 'Promotion ou annee academique', maxLength: 80 },
      { key: 'graduatePhoto', type: 'image', label: 'Photo du diplome' },
      { key: 'thankYouMessage', type: 'textarea', label: 'Message de remerciement' },
      { key: 'contacts', type: 'contacts', label: 'Contacts utiles' },
    ],
  },

  fiancailles: {
    label: 'Fiancailles',
    emoji: '\u{1F48D}',
    description: 'Ceremonie de fiancailles et histoire du couple.',
    templates: ['Romantique', 'Floral', 'Traditionnel', 'Elegant', 'Luxe'],
    fields: [
      { key: 'partner1Name', type: 'text', label: 'Premiere personne', required: true, maxLength: 120 },
      { key: 'partner2Name', type: 'text', label: 'Deuxieme personne', maxLength: 120 },
      { key: 'couplePhotos', type: 'gallery', label: 'Photos du couple' },
      {
        key: 'ceremonyType',
        type: 'select',
        label: 'Type de ceremonie',
        options: [
          { value: 'traditionnelle', label: 'Traditionnelle' },
          { value: 'moderne', label: 'Moderne' },
          { value: 'religieuse', label: 'Religieuse' },
          { value: 'civile', label: 'Civile' },
          { value: 'autre', label: 'Autre' },
        ],
      },
      { key: 'story', type: 'textarea', label: 'Histoire du couple' },
      { key: 'invitationMessage', type: 'textarea', label: 'Message d\'invitation' },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },

  'baby-shower': {
    label: 'Baby Shower',
    emoji: '\u{1F476}',
    description: 'Fete avant l\'arrivee du bebe, douce et elegante.',
    templates: ['Pastel', 'Floral', 'Bebe', 'Minimaliste', 'Elegant'],
    defaults: { visibility: 'private' },
    fields: [
      { key: 'parentsNames', type: 'text', label: 'Noms des futurs parents', maxLength: 160 },
      { key: 'parentsPhoto', type: 'image', label: 'Photo des parents' },
      { key: 'babyName', type: 'text', label: 'Prenom du bebe (facultatif)', maxLength: 80 },
      { key: 'parentsMessage', type: 'textarea', label: 'Message des parents' },
      { key: 'practicalInfo', type: 'textarea', label: 'Informations pratiques' },
      { key: 'giftList', type: 'list', label: 'Liste de cadeaux' },
    ],
  },

  soiree: {
    label: 'Soiree',
    emoji: '\u{1F389}',
    description: 'Soiree privee, fete, concert ou evenement de divertissement.',
    templates: ['Party', 'Concert', 'Night', 'Elegant', 'Minimaliste'],
    fields: [
      {
        key: 'partyType',
        type: 'select',
        label: 'Type de soiree',
        options: [
          { value: 'anniversaire', label: 'Anniversaire' },
          { value: 'concert', label: 'Concert' },
          { value: 'dansante', label: 'Soiree dansante' },
          { value: 'privee', label: 'Fete privee' },
          { value: 'autre', label: 'Autre' },
        ],
      },
      { key: 'poster', type: 'image', label: 'Affiche' },
      { key: 'organizer', type: 'text', label: 'Organisateur', maxLength: 160 },
      { key: 'artists', type: 'list', label: 'Artistes / DJ' },
      { key: 'dressCode', type: 'text', label: 'Code vestimentaire', maxLength: 160 },
      { key: 'minAge', type: 'number', label: 'Age minimum' },
      { key: 'maxCapacity', type: 'number', label: 'Capacite maximale' },
      { key: 'ticketsInfo', type: 'textarea', label: 'Billets / tarifs (informations)' },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },

  inauguration: {
    label: 'Inauguration',
    emoji: '\u{1F3E0}',
    description: 'Inauguration d\'une entreprise, d\'un commerce ou d\'un lieu.',
    templates: ['Corporate', 'Moderne', 'Elegant', 'Minimaliste', 'Luxe'],
    fields: [
      { key: 'establishmentName', type: 'text', label: 'Nom de l\'etablissement', required: true, maxLength: 160 },
      {
        key: 'establishmentType',
        type: 'select',
        label: 'Type d\'etablissement',
        options: [
          { value: 'entreprise', label: 'Entreprise' },
          { value: 'commerce', label: 'Commerce' },
          { value: 'restaurant', label: 'Restaurant' },
          { value: 'batiment', label: 'Batiment' },
          { value: 'autre', label: 'Autre' },
        ],
      },
      { key: 'activityDescription', type: 'textarea', label: 'Description de l\'activite' },
      { key: 'organizerName', type: 'text', label: 'Organisateur', maxLength: 160 },
      { key: 'logo', type: 'image', label: 'Logo' },
      { key: 'coverImage', type: 'image', label: 'Photo de couverture' },
      { key: 'website', type: 'text', label: 'Site web', maxLength: 300 },
      { key: 'socials', type: 'links', label: 'Reseaux sociaux' },
      { key: 'practicalInfo', type: 'textarea', label: 'Informations pratiques' },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },

  'evenement-professionnel': {
    label: 'Evenement professionnel',
    emoji: '\u{1F4BC}',
    description: 'Conferences, seminaires, ateliers, formations et salons.',
    templates: ['Corporate', 'Conference', 'Tech', 'Business', 'Minimaliste'],
    fields: [
      { key: 'professionalType', type: 'select', label: 'Type d\'evenement', options: [
        { value: 'conference', label: 'Conference' },
        { value: 'seminaire', label: 'Seminaire' },
        { value: 'atelier', label: 'Atelier' },
        { value: 'formation', label: 'Formation' },
        { value: 'reunion', label: 'Reunion' },
        { value: 'salon', label: 'Salon' },
        { value: 'autre', label: 'Autre' },
      ] },
      { key: 'companyName', type: 'text', label: 'Entreprise organisatrice', maxLength: 160 },
      { key: 'companyLogo', type: 'image', label: 'Logo de l\'entreprise' },
      { key: 'coverImage', type: 'image', label: 'Image de couverture' },
      { key: 'participationType', type: 'select', label: 'Type de participation', required: true, options: [
        { value: 'presentiel', label: 'Presentiel' },
        { value: 'en_ligne', label: 'En ligne' },
        { value: 'hybride', label: 'Hybride' },
      ] },
      { key: 'visioLink', type: 'text', label: 'Lien de visioconference', maxLength: 500 },
      { key: 'speakers', type: 'speakers', label: 'Intervenants' },
      { key: 'maxCapacity', type: 'number', label: 'Capacite maximale' },
      { key: 'conditions', type: 'textarea', label: 'Conditions de participation' },
      { key: 'pricing', type: 'textarea', label: 'Tarifs (informations)' },
      { key: 'website', type: 'text', label: 'Site web', maxLength: 300 },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },

  commemoration: {
    label: 'Commemoration',
    emoji: '\u{1F54A}\u{FE0F}',
    description: 'Hommage, ceremonie du souvenir ou celebration de memoire.',
    templates: ['Sobre', 'Classique', 'Floral', 'Minimaliste', 'Elegant'],
    defaults: { visibility: 'private', countdownEnabled: false },
    fields: [
      { key: 'commemoratedName', type: 'text', label: 'Personne ou evenement commemore', required: true, maxLength: 160 },
      { key: 'commemoratedPhoto', type: 'image', label: 'Photo' },
      { key: 'importantDates', type: 'list', label: 'Dates importantes' },
      { key: 'tributeMessage', type: 'textarea', label: 'Message d\'hommage' },
      { key: 'commemorativeText', type: 'textarea', label: 'Texte commemoratif' },
      { key: 'organizerName', type: 'text', label: 'Organisateur', maxLength: 160 },
      { key: 'practicalInfo', type: 'textarea', label: 'Informations pratiques' },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },

  autres: {
    label: 'Autres evenements',
    emoji: '\u{1F38A}',
    description: 'Evenement personnalise qui ne rentre dans aucune categorie.',
    templates: ['Universel', 'Moderne', 'Elegant', 'Festif', 'Minimaliste'],
    fields: [
      { key: 'customSubType', type: 'text', label: 'Type / sous-categorie', maxLength: 160 },
      { key: 'organizerName', type: 'text', label: 'Organisateur', maxLength: 160 },
      { key: 'practicalInfo', type: 'textarea', label: 'Informations pratiques' },
      { key: 'sections', type: 'sections', label: 'Sections personnalisees' },
      { key: 'contacts', type: 'contacts', label: 'Contacts' },
    ],
  },
});

/** Retourne la configuration d'une categorie (ou undefined). */
export function getCategoryFields(slug) {
  return CATEGORY_FIELDS[slug];
}
