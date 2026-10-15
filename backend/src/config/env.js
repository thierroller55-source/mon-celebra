import dotenv from 'dotenv';
import { z } from 'zod';
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
  REFRESH_TOKEN_SECRET: z.string().min(16).default('change-me-refresh-secret-key'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:5000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(3),
  STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
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

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  uploadDir: path.resolve(__dirname, '../../', parsed.data.UPLOAD_DIR),
  storageDriver: parsed.data.STORAGE_DRIVER,
  cloudinary: {
    enabled: parsed.data.STORAGE_DRIVER === 'cloudinary' && cloudinaryConfigured,
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
  },
};
