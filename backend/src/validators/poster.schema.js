import { z } from 'zod';
import { POSTER_MODES, QR_MIN_SIZE, QR_POSITIONS } from '../config/poster.js';

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Identifiant invalide.');

export const posterQrSchema = z
  .object({
    x: z.coerce.number().min(0, 'x doit etre entre 0 et 1.').max(1, 'x doit etre entre 0 et 1.'),
    y: z.coerce.number().min(0, 'y doit etre entre 0 et 1.').max(1, 'y doit etre entre 0 et 1.'),
    size: z.coerce
      .number()
      .min(QR_MIN_SIZE, 'La taille du QR doit etre au moins 15 % de la largeur.')
      .max(1, 'La taille du QR doit etre au plus 100 % de la largeur.'),
    position: z.enum(QR_POSITIONS).optional(),
    captionVisible: z.boolean().optional(),
  })
  .strict();

export const posterSettingsSchema = z
  .object({
    mode: z.enum(POSTER_MODES).optional(),
    templateId: objectId.nullable().optional(),
    qr: posterQrSchema.optional(),
  })
  .strict();

function parseFormQr(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const formQrSchema = z.preprocess(
  parseFormQr,
  z.union([posterQrSchema, z.undefined()]),
);

const formBoolean = z.preprocess(
  (value) => value === true || value === 'true' || value === '1' || value === 'on',
  z.literal(true, {
    errorMap: () => ({ message: "Vous devez confirmer avoir le droit d'utiliser ce visuel." }),
  }),
);

export const posterImportSchema = z
  .object({
    rightsConfirmed: formBoolean,
    qr: formQrSchema.optional(),
  })
  .strict();
