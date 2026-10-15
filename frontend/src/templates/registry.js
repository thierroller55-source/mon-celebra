import { createElement } from 'react';
import EventTemplate from './EventTemplate.jsx';

/**
 * Registre des modeles. Chaque `componentKey` (defini cote backend dans
 * seed/templates.seed.js) se resout en un rendu `EventTemplate` avec une
 * variante graphique.
 *
 * Ajouter un modele = ajouter une correspondance ici (l'engine reste unique).
 */
const SUFFIX_TO_VARIANT = {
  elegant: 'elegant',
  luxe: 'elegant',
  luxury: 'elegant',
  classique: 'elegant',
  traditionnel: 'elegant',
  traditional: 'elegant',
  corporate: 'elegant',
  business: 'elegant',
  academique: 'elegant',
  sobre: 'elegant',
  romantic: 'elegant',

  modern: 'modern',
  moderne: 'modern',
  conference: 'modern',
  floral: 'modern',
  pastel: 'modern',
  bebe: 'modern',
  baby: 'modern',
  tech: 'modern',
  universel: 'modern',

  party: 'bold',
  festif: 'bold',
  fun: 'bold',
  night: 'bold',
  concert: 'bold',
  kids: 'bold',

  minimal: 'minimal',
  minimaliste: 'minimal',
};

const DEFAULT_VARIANT = 'classic';

/** Retourne la variante graphique associee a un componentKey. */
export function resolveVariant(componentKey = '') {
  const suffix = String(componentKey).split('-').pop();
  return SUFFIX_TO_VARIANT[suffix] || DEFAULT_VARIANT;
}

/** Retourne le composant de rendu pour un componentKey donne (fallback classic). */
export function getTemplateComponent(componentKey) {
  const variant = resolveVariant(componentKey);
  return function ResolvedTemplate(props) {
    return createElement(EventTemplate, { ...props, variant });
  };
}

export { EventTemplate };
