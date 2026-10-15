import { Template } from '../src/models/Template.js';
import { DEFAULT_DESIGN } from '../src/config/constants.js';

/**
 * Templates de base par categorie (voir docs/ARCHITECTURE.md section 10).
 * `componentKey` doit correspondre a une cle du registre frontend
 * (frontend/src/templates/registry.js).
 */
const TEMPLATES = [
  // Mariage
  { categorySlug: 'mariage', name: 'Elegance doree', componentKey: 'mariage-elegant', order: 1, isPremium: false, layout: { primaryColor: '#B08D57', secondaryColor: '#1F2937', fontHeading: 'Playfair Display', fontBody: 'Inter' } },
  { categorySlug: 'mariage', name: 'Romantique', componentKey: 'mariage-romantic', order: 2, isPremium: false, layout: { primaryColor: '#C98B9B', secondaryColor: '#4A2C3A', fontHeading: 'Cormorant Garamond', fontBody: 'Inter' } },
  { categorySlug: 'mariage', name: 'Luxe', componentKey: 'mariage-luxury', order: 3, isPremium: true, layout: { primaryColor: '#0F172A', secondaryColor: '#C9A227', fontHeading: 'Cinzel', fontBody: 'Inter' } },
  { categorySlug: 'mariage', name: 'Moderne', componentKey: 'mariage-modern', order: 4, isPremium: false, layout: { primaryColor: '#2563EB', secondaryColor: '#0F172A', fontHeading: 'Poppins', fontBody: 'Inter' } },
  { categorySlug: 'mariage', name: 'Minimaliste', componentKey: 'mariage-minimal', order: 5, isPremium: false, layout: { primaryColor: '#111827', secondaryColor: '#6B7280', fontHeading: 'Inter', fontBody: 'Inter' } },
  { categorySlug: 'mariage', name: 'Traditionnel', componentKey: 'mariage-traditional', order: 6, isPremium: false, layout: { primaryColor: '#8B5E34', secondaryColor: '#3B2416', fontHeading: 'Merriweather', fontBody: 'Inter' } },

  // Anniversaire
  { categorySlug: 'anniversaire', name: 'Festif', componentKey: 'anniversaire-fun', order: 1, isPremium: false, layout: { primaryColor: '#F97316', secondaryColor: '#7C2D12', fontHeading: 'Baloo 2', fontBody: 'Inter' } },
  { categorySlug: 'anniversaire', name: 'Fete', componentKey: 'anniversaire-party', order: 2, isPremium: false, layout: { primaryColor: '#DB2777', secondaryColor: '#4C0519', fontHeading: 'Poppins', fontBody: 'Inter' } },
  { categorySlug: 'anniversaire', name: 'Elegant', componentKey: 'anniversaire-elegant', order: 3, isPremium: false, layout: { primaryColor: '#0F172A', secondaryColor: '#C9A227', fontHeading: 'Playfair Display', fontBody: 'Inter' } },
  { categorySlug: 'anniversaire', name: 'Moderne', componentKey: 'anniversaire-modern', order: 4, isPremium: false, layout: { primaryColor: '#2563EB', secondaryColor: '#0F172A', fontHeading: 'Poppins', fontBody: 'Inter' } },
  { categorySlug: 'anniversaire', name: 'Enfants', componentKey: 'anniversaire-kids', order: 5, isPremium: false, layout: { primaryColor: '#22C55E', secondaryColor: '#7C2D12', fontHeading: 'Baloo 2', fontBody: 'Nunito' } },

  // Bapteme
  { categorySlug: 'bapteme', name: 'Baby', componentKey: 'bapteme-baby', order: 1, isPremium: false, layout: { primaryColor: '#93C5FD', secondaryColor: '#1E3A8A', fontHeading: 'Nunito', fontBody: 'Inter' } },
  { categorySlug: 'bapteme', name: 'Elegant', componentKey: 'bapteme-elegant', order: 2, isPremium: false, layout: { primaryColor: '#B08D57', secondaryColor: '#1F2937', fontHeading: 'Playfair Display', fontBody: 'Inter' } },
  { categorySlug: 'bapteme', name: 'Minimaliste', componentKey: 'bapteme-minimal', order: 3, isPremium: false, layout: { primaryColor: '#111827', secondaryColor: '#6B7280', fontHeading: 'Inter', fontBody: 'Inter' } },
  { categorySlug: 'bapteme', name: 'Floral', componentKey: 'bapteme-floral', order: 4, isPremium: false, layout: { primaryColor: '#E11D48', secondaryColor: '#4C0519', fontHeading: 'Cormorant Garamond', fontBody: 'Inter' } },
];

/** Palettes par style (reutilisees par les nouvelles categories). */
const PALETTES = {
  moderne: { primaryColor: '#2563EB', secondaryColor: '#0F172A', fontHeading: 'Poppins', fontBody: 'Inter' },
  elegant: { primaryColor: '#B08D57', secondaryColor: '#1F2937', fontHeading: 'Playfair Display', fontBody: 'Inter' },
  minimaliste: { primaryColor: '#111827', secondaryColor: '#6B7280', fontHeading: 'Inter', fontBody: 'Inter' },
  festif: { primaryColor: '#F97316', secondaryColor: '#7C2D12', fontHeading: 'Baloo 2', fontBody: 'Inter' },
  academique: { primaryColor: '#7C2D12', secondaryColor: '#1F2937', fontHeading: 'Merriweather', fontBody: 'Inter' },
  romantique: { primaryColor: '#C98B9B', secondaryColor: '#4A2C3A', fontHeading: 'Cormorant Garamond', fontBody: 'Inter' },
  floral: { primaryColor: '#E11D48', secondaryColor: '#4C0519', fontHeading: 'Cormorant Garamond', fontBody: 'Inter' },
  traditionnel: { primaryColor: '#8B5E34', secondaryColor: '#3B2416', fontHeading: 'Merriweather', fontBody: 'Inter' },
  luxe: { primaryColor: '#0F172A', secondaryColor: '#C9A227', fontHeading: 'Cinzel', fontBody: 'Inter' },
  pastel: { primaryColor: '#93C5FD', secondaryColor: '#1E3A8A', fontHeading: 'Nunito', fontBody: 'Inter' },
  bebe: { primaryColor: '#F9A8D4', secondaryColor: '#831843', fontHeading: 'Nunito', fontBody: 'Inter' },
  party: { primaryColor: '#DB2777', secondaryColor: '#4C0519', fontHeading: 'Poppins', fontBody: 'Inter' },
  concert: { primaryColor: '#7C3AED', secondaryColor: '#111827', fontHeading: 'Poppins', fontBody: 'Inter' },
  night: { primaryColor: '#7C3AED', secondaryColor: '#0B1020', fontHeading: 'Poppins', fontBody: 'Inter' },
  corporate: { primaryColor: '#0F62FE', secondaryColor: '#0F172A', fontHeading: 'Inter', fontBody: 'Inter' },
  conference: { primaryColor: '#1D4ED8', secondaryColor: '#0F172A', fontHeading: 'Inter', fontBody: 'Inter' },
  tech: { primaryColor: '#06B6D4', secondaryColor: '#0F172A', fontHeading: 'Poppins', fontBody: 'Inter' },
  business: { primaryColor: '#111827', secondaryColor: '#C9A227', fontHeading: 'Playfair Display', fontBody: 'Inter' },
  sobre: { primaryColor: '#374151', secondaryColor: '#111827', fontHeading: 'Merriweather', fontBody: 'Inter' },
  classique: { primaryColor: '#4B5563', secondaryColor: '#1F2937', fontHeading: 'Merriweather', fontBody: 'Inter' },
  universel: { primaryColor: '#4F46E5', secondaryColor: '#111827', fontHeading: 'Poppins', fontBody: 'Inter' },
};

/** [categorie, [[nom, style, premium], ...]] */
const NEW_TEMPLATES = [
  ['graduation', [['Moderne', 'moderne'], ['Elegant', 'elegant'], ['Academique', 'academique'], ['Minimaliste', 'minimaliste'], ['Festif', 'festif']]],
  ['fiancailles', [['Romantique', 'romantique'], ['Floral', 'floral'], ['Traditionnel', 'traditionnel'], ['Elegant', 'elegant'], ['Luxe', 'luxe', true]]],
  ['baby-shower', [['Pastel', 'pastel'], ['Floral', 'floral'], ['Bebe', 'bebe'], ['Minimaliste', 'minimaliste'], ['Elegant', 'elegant']]],
  ['soiree', [['Party', 'party'], ['Concert', 'concert'], ['Night', 'night'], ['Elegant', 'elegant'], ['Minimaliste', 'minimaliste']]],
  ['inauguration', [['Corporate', 'corporate'], ['Moderne', 'moderne'], ['Elegant', 'elegant'], ['Minimaliste', 'minimaliste'], ['Luxe', 'luxe', true]]],
  ['evenement-professionnel', [['Corporate', 'corporate'], ['Conference', 'conference'], ['Tech', 'tech'], ['Business', 'business'], ['Minimaliste', 'minimaliste']]],
  ['commemoration', [['Sobre', 'sobre'], ['Classique', 'classique'], ['Floral', 'floral'], ['Minimaliste', 'minimaliste'], ['Elegant', 'elegant']]],
  ['autres', [['Universel', 'universel'], ['Moderne', 'moderne'], ['Elegant', 'elegant'], ['Festif', 'festif'], ['Minimaliste', 'minimaliste']]],
];

for (const [categorySlug, entries] of NEW_TEMPLATES) {
  entries.forEach(([name, style, isPremium = false], index) => {
    TEMPLATES.push({
      categorySlug,
      name,
      componentKey: `${categorySlug}-${style}`,
      order: index + 1,
      isPremium,
      layout: PALETTES[style],
    });
  });
}

/**
 * Insere / met a jour les templates de base (idempotent).
 * Cle d'unicite logique : categorySlug + componentKey.
 */
export async function seedTemplates() {
  const operations = TEMPLATES.map((template) => ({
    updateOne: {
      filter: { categorySlug: template.categorySlug, componentKey: template.componentKey },
      update: {
        $set: {
          name: template.name,
          categorySlug: template.categorySlug,
          componentKey: template.componentKey,
          layout: { ...DEFAULT_DESIGN, ...template.layout },
          isPremium: template.isPremium,
          isActive: true,
          order: template.order,
        },
      },
      upsert: true,
    },
  }));

  const result = await Template.bulkWrite(operations);
  return {
    created: result.upsertedCount,
    updated: result.modifiedCount,
    total: TEMPLATES.length,
  };
}
