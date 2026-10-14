/**
 * Enveloppe un handler async pour propager les erreurs vers errorHandler
 * sans try/catch repetitif dans chaque controller.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
