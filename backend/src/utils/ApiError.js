/**
 * Erreur metier normalisee. Le message renvoye au client doit toujours etre
 * comprehensible et ne jamais exposer de details techniques.
 */
export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Requete invalide.', code = 'BAD_REQUEST', details) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Authentification requise.', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Acces non autorise.', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Ressource introuvable.', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message = 'Conflit de donnees.', code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static tooMany(message = 'Trop de requetes, reessayez plus tard.', code = 'RATE_LIMITED', details) {
    return new ApiError(429, message, code, details);
  }

  static serviceUnavailable(message = 'Service temporairement indisponible.', code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, code);
  }
}
