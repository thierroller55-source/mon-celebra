import { z } from 'zod';
import { RSVP_RESPONSE, RSVP_HOST_RESPONSE } from '../config/constants.js';

/**
 * RSVP d'un invite connecte. Le nom, l'email et le telephone proviennent du
 * compte du visiteur : seuls la reponse, le nombre d'accompagnants et le
 * message sont saisis dans le formulaire.
 */
export const rsvpSchema = z.object({
  guestsCount: z.coerce.number().int().min(1).max(50).default(1),
  response: z.enum(Object.values(RSVP_RESPONSE)),
  message: z.string().trim().max(500).optional(),
});

/** Reponse de l'hote : accepte ou refuse la presence d'un invite. */
export const hostRsvpResponseSchema = z.object({
  hostResponse: z.enum(Object.values(RSVP_HOST_RESPONSE)),
});
