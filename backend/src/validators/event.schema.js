import { z } from 'zod';
import {
  PLACE_TYPES,
  CATEGORY_SLUGS,
  EVENT_VISIBILITY,
  LANGUAGES,
} from '../config/constants.js';
import { CATEGORY_FIELDS } from '../config/categoryFields.js';

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Couleur hexadecimale invalide.');

const locationSchema = z.object({
  label: z.string().trim().max(120).optional(),
  type: z.enum(PLACE_TYPES).optional(),
  name: z.string().trim().max(160).optional(),
  address: z.string().trim().max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  time: z.string().trim().max(20).optional(),
});

const programItemSchema = z.object({
  time: z.string().trim().max(20).optional(),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(500).optional(),
});

const designSchema = z.object({
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  fontHeading: z.string().trim().max(60).optional(),
  fontBody: z.string().trim().max(60).optional(),
  background: hexColor.optional(),
  customTexts: z
    .object({
      headline: z.string().trim().max(160).optional(),
      subtitle: z.string().trim().max(160).optional(),
    })
    .optional(),
});

const settingsSchema = z.object({
  rsvpEnabled: z.boolean().optional(),
  guestbookEnabled: z.boolean().optional(),
  guestbookModeration: z.boolean().optional(),
  countdownEnabled: z.boolean().optional(),
  musicUrl: z.string().trim().max(500).nullable().optional(),
});

/* ------------------------------------------------------------------ */
/* Champs specifiques a la categorie (event.details)                   */
/* ------------------------------------------------------------------ */

const detailImageSchema = z.object({
  url: z.string().trim().min(1).max(600),
  publicId: z.string().trim().max(200).nullable().optional(),
});

const detailContactSchema = z.object({
  label: z.string().trim().max(120).optional(),
  value: z.string().trim().max(300).optional(),
});

const detailLinkSchema = z.object({
  label: z.string().trim().max(120).optional(),
  url: z.string().trim().max(600).optional(),
});

const detailSpeakerSchema = z.object({
  name: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1000).optional(),
  photo: detailImageSchema.optional(),
});

const detailSectionSchema = z.object({
  title: z.string().trim().max(160).optional(),
  content: z.string().trim().max(3000).optional(),
});

/** Rend un champ optionnel en tolerant les valeurs vides du formulaire. */
const optional = (schema) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional());

const STRING_TYPES = new Set(['text', 'textarea', 'date', 'time']);

function fieldToZod(field) {
  const max = field.maxLength;
  let base;

  switch (field.type) {
    case 'textarea':
      base = z.string().trim().max(max ?? 5000);
      break;
    case 'number':
      base = z.coerce.number();
      break;
    case 'boolean':
      base = z.boolean();
      break;
    case 'select':
      base = z.enum((field.options || []).map((option) => option.value));
      break;
    case 'image':
      base = detailImageSchema;
      break;
    case 'gallery':
      base = z.array(detailImageSchema).max(30);
      break;
    case 'list':
      base = z.array(z.string().trim().max(300)).max(50);
      break;
    case 'program':
      base = z.array(programItemSchema).max(30);
      break;
    case 'contacts':
      base = z.array(detailContactSchema).max(30);
      break;
    case 'links':
      base = z.array(detailLinkSchema).max(30);
      break;
    case 'speakers':
      base = z.array(detailSpeakerSchema).max(50);
      break;
    case 'sections':
      base = z.array(detailSectionSchema).max(30);
      break;
    default:
      base = z.string().trim().max(max ?? 300);
      break;
  }

  if (field.required) {
    if (STRING_TYPES.has(field.type) || field.type === undefined) {
      return base.min(1, 'Ce champ est obligatoire.');
    }
    return base;
  }

  return optional(base);
}

/** Construit le schema Zod de `details` pour une categorie donnee. */
export function buildDetailsSchema(categorySlug) {
  const config = CATEGORY_FIELDS[categorySlug];
  if (!config) return z.object({}).passthrough();

  const shape = {};
  for (const field of config.fields) {
    shape[field.key] = fieldToZod(field);
  }
  return z.object(shape);
}

/** Valide `details` selon la categorie et nettoie les cles inconnues. */
function refineDetails(data, ctx) {
  if (data.details === undefined) return;
  const category = data.category;
  if (!category || !CATEGORY_FIELDS[category]) return;

  const parsed = buildDetailsSchema(category).safeParse(data.details);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      ctx.addIssue({ ...issue, path: ['details', ...issue.path] });
    }
  } else {
    // Les cles non declarees sont supprimees (objet Zod strict par defaut).
    data.details = parsed.data;
  }
}

const baseEventSchema = z.object({
  category: z.enum(CATEGORY_SLUGS),
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caracteres.').max(160),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  date: z.coerce.date().optional(),
  startTime: z.string().trim().max(10).optional(),
  endTime: z.string().trim().max(10).optional(),
  timezone: z.string().trim().max(60).optional(),
  language: z.enum(LANGUAGES).optional(),
  location: locationSchema.optional(),
  locations: z.array(locationSchema).max(10).optional(),
  templateId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Template invalide.')
    .nullable()
    .optional(),
  design: designSchema.optional(),
  program: z.array(programItemSchema).max(30).optional(),
  details: z.record(z.any()).optional(),
  visibility: z.enum(Object.values(EVENT_VISIBILITY)).optional(),
  accessCode: z.string().trim().min(4).max(40).optional(),
  settings: settingsSchema.optional(),
});

export const createEventSchema = baseEventSchema.superRefine(refineDetails);
export const updateEventSchema = baseEventSchema.partial().superRefine(refineDetails);
