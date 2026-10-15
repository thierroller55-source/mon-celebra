import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { ROLES } from '../config/constants.js';
import { User } from '../models/User.js';
import { extractToken } from './auth.js';

/** Restreint l'acces aux administrateurs. A utiliser apres verifyToken. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== ROLES.ADMIN) {
    return next(ApiError.forbidden('Acces reserve aux administrateurs.', 'ADMIN_ONLY'));
  }
  return next();
}

/**
 * Autorise la creation d'un compte administrateur :
 * - si aucun admin n'existe encore (amorcage / bootstrap), la requete passe ;
 * - sinon, seul un admin authentifie peut creer un nouvel admin.
 */
export const requireAdminOrBootstrap = asyncHandler(async (req, res, next) => {
  const adminExists = await User.exists({ role: ROLES.ADMIN });
  if (!adminExists) return next();

  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized());

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== ROLES.ADMIN) {
      throw ApiError.forbidden('Acces reserve aux administrateurs.', 'ADMIN_ONLY');
    }
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(ApiError.unauthorized('Token invalide.', 'INVALID_TOKEN'));
  }
});
