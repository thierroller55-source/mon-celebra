import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const allowedOrigins = env.CLIENT_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Defense anti-CSRF complementaire a SameSite=None : pour toute requete
 * modifiante (POST/PUT/PATCH/DELETE), l'en-tete Origin doit faire partie des
 * origines autorisees. Les requetes sans Origin (curl, appels serveur-a-serveur,
 * mobile) sont autorisees car aucun navigateur ne peut les forger a l'insu de
 * l'utilisateur.
 */
export function originGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  if (!origin) return next();

  if (allowedOrigins.includes(origin)) return next();

  return res.status(403).json({
    success: false,
    message: 'Origine non autorisee.',
    code: 'ORIGIN_DENIED',
  });
}
