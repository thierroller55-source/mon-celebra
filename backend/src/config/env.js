import dotenv from 'dotenv';
import { z } from 'zod';
import { APP_NAME } from './brand.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI est obligatoire'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET doit contenir au moins 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET doit contenir au moins 16 caracteres'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).optional(),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:5000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(3),
  STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  // Envoi d'emails transactionnels via Brevo (optionnel : desactive si absent).
  BREVO_API_KEY: optionalString,
  MAIL_FROM: z.string().email().default('no-reply@moncelebra.com'),
  MAIL_FROM_NAME: z.string().default(APP_NAME),
  MAIL_REPLY_TO: optionalString,
}).superRefine((data, ctx) => {
  const cloudinaryVars = [
    data.CLOUDINARY_CLOUD_NAME,
    data.CLOUDINARY_API_KEY,
    data.CLOUDINARY_API_SECRET,
  ];
  const provided = cloudinaryVars.filter(Boolean).length;
  const wantsCloudinary = data.STORAGE_DRIVER === 'cloudinary';

  if (wantsCloudinary && provided !== 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'STORAGE_DRIVER=cloudinary exige CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.',
    });
  } else if (!wantsCloudinary && provided !== 0 && provided !== 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Configuration Cloudinary incomplete : renseignez les 3 variables ou aucune.',
    });
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Configuration invalide (.env):\n${details}`);
  process.exit(1);
}

const cloudinaryConfigured = Boolean(
  parsed.data.CLOUDINARY_CLOUD_NAME &&
    parsed.data.CLOUDINARY_API_KEY &&
    parsed.data.CLOUDINARY_API_SECRET,
);

// Premiere origine cliente (sert a construire les liens dans les emails).
const clientUrl = parsed.data.CLIENT_URL.split(',')[0].trim().replace(/\/+$/, '');

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  uploadDir: path.resolve(__dirname, '../../', parsed.data.UPLOAD_DIR),
  storageDriver: parsed.data.STORAGE_DRIVER,
  clientUrl,
  cloudinary: {
    enabled: parsed.data.STORAGE_DRIVER === 'cloudinary' && cloudinaryConfigured,
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
  },
  brevo: {
    enabled: Boolean(parsed.data.BREVO_API_KEY),
    apiKey: parsed.data.BREVO_API_KEY,
    from: parsed.data.MAIL_FROM,
    fromName: parsed.data.MAIL_FROM_NAME,
    replyTo: parsed.data.MAIL_REPLY_TO,
  },
};
