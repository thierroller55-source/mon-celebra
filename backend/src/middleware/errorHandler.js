import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Convertit toute erreur en reponse JSON normalisee et comprehensible.
 * Ne jamais exposer de stack technique au client.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err;

  if (err.name === 'CastError') {
    error = ApiError.badRequest('Identifiant invalide.', 'INVALID_ID');
  } else if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new ApiError(400, 'Donnees invalides.', 'VALIDATION_ERROR', details);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    error = ApiError.conflict(`Cette valeur (${field}) est deja utilisee.`, 'DUPLICATE');
  } else if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Fichier trop volumineux.'
        : 'Erreur lors de l\'envoi du fichier.';
    error = ApiError.badRequest(message, 'UPLOAD_ERROR');
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(
      500,
      'Une erreur est survenue. Veuillez reessayer dans quelques instants.',
      'INTERNAL',
    );
  }

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  }

  const payload = {
    success: false,
    message: error.message,
    code: error.code,
  };
  if (error.details) payload.details = error.details;

  res.status(error.statusCode).json(payload);
}
