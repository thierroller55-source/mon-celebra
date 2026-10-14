import rateLimit from 'express-rate-limit';

function makeLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
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
