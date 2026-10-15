import { z } from 'zod';

export const reportStatusSchema = z.object({
  status: z.enum(['open', 'closed']),
});

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9 et tirets).')
  .max(60);

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugField,
  icon: z.string().trim().max(40).optional(),
  description: z.string().trim().max(300).optional(),
  isMvp: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const templateCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  categorySlug: slugField,
  componentKey: z.string().trim().min(1).max(80),
  thumbnail: z.string().trim().url('URL de vignette invalide.').nullable().optional(),
  layout: z.record(z.any()).optional(),
  isPremium: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

export const templateUpdateSchema = templateCreateSchema.partial();
