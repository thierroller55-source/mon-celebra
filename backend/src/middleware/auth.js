import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function extractToken(req) {
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


