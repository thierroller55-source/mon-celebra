import { ApiError } from '../utils/ApiError.js';

/**
 * Valide une partie de la requete avec un schema Zod.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    return next(ApiError.badRequest('Formulaire invalide.', 'VALIDATION_ERROR', details));
  }

  // Remplace par les donnees validees/nettoyees
  req[source] = result.data;
  return next();
};
