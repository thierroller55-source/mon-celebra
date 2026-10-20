import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  // Fallback : cookie access token (utile pour les appels navigateur)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

/** Verifie le JWT et attache l'utilisateur a la requete. */
export function verifyToken(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return next(
      ApiError.unauthorized(
        expired ? 'Session expiree. Reconnectez-vous.' : 'Token invalide.',
        expired ? 'SESSION_EXPIRED' : 'INVALID_TOKEN',
      ),
    );
  }
}

/**
 * Variante tolerante : attache req.user si un token valide est present, mais
 * ne bloque JAMAIS la requete sinon. Utile pour les pages publiques qui
 * enrichissent l'affichage quand le visiteur est connecte (ex : son propre
 * RSVP sur la page d'un evenement).
 */
export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Token absent/expire : on reste en anonyme, sans erreur.
  }
  return next();
}


