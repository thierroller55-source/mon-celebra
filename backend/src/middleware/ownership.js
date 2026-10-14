import { Event } from '../models/Event.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Anti-IDOR : charge l'evenement cible et verifie qu'il appartient bien a
 * l'utilisateur authentifie avant toute lecture/modification sensible.
 * Le resultat est expose via req.event pour eviter une double requete.
 */
export const requireEventOwner = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw ApiError.notFound('Evenement introuvable.');
  }

  if (String(event.ownerId) !== String(req.user.id)) {
    throw ApiError.forbidden("Vous n'avez pas acces a cet evenement.");
  }

  req.event = event;
  next();
});
