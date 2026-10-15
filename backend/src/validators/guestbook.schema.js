import { z } from 'zod';

export const guestbookSchema = z.object({
  authorName: z.string().trim().min(1, "Le nom est obligatoire.").max(120),
  message: z.string().trim().min(1, 'Le message est obligatoire.').max(1000),
});

export const guestbookModerationSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
});
