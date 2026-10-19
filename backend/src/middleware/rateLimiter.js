import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function makeLimiter({ windowMs, max, message }) {
  // En developpement et test, on ne limite pas : sinon les tests automatises
  // (Playwright, node --test) declenchent des 429 et deviennent instables.
  const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
  return rateLimit({
    windowMs,
    max,
    skip: () => isDev,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ success: false, message, code: 'RATE_LIMITED' });
    },
  });
}

/** Limiteur global applique a toute l'API. */
export const globalLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Trop de requetes. Veuillez reessayer dans quelques minutes.',
});

/** Limiteur renforce pour l'authentification. */
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives. Veuillez reessayer dans quelques minutes.',
});

/** Limiteur pour les ecritures publiques (RSVP, livre d'or, signalements). */
export const publicWriteLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Trop de requetes. Veuillez patienter avant de reessayer.',
});
