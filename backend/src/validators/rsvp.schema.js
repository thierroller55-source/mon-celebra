import { z } from 'zod';
import { RSVP_RESPONSE } from '../config/constants.js';

export const rsvpSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire.').max(120),
  phone: z.string().trim().max(30).optional(),
  guestsCount: z.coerce.number().int().min(1).max(50).default(1),
  response: z.enum(Object.values(RSVP_RESPONSE)),
  message: z.string().trim().max(500).optional(),
});
