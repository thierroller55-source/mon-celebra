import { z } from 'zod';

export const reportSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Evenement invalide.'),
  reporterEmail: z.string().trim().toLowerCase().email('Email invalide.').optional(),
  reason: z.string().trim().min(5, 'Merci de decrire le motif.').max(1000),
});
