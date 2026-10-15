import { Event } from '../models/Event.js';
import { slugify } from '../utils/slugify.js';

/**
 * Genere un slug unique pour un evenement a partir de son titre.
 * Ajoute un suffixe numerique en cas de collision (ex: "mariage-awa-2").
 */
export async function generateUniqueEventSlug(title) {
  const base = slugify(title) || 'evenement';
  let candidate = base;
  let suffix = 2;

  while (await Event.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
