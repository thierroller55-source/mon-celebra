import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

/** Restreint l'acces a certains roles. A utiliser apres verifyToken. */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    return next();
  };
}

export const requireAdmin = requireRole(ROLES.ADMIN);
