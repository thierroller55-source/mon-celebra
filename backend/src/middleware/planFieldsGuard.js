import { ApiError } from '../utils/ApiError.js';

const FORBIDDEN_USER_FIELDS = new Set(['plan', 'proUntil', 'premiumUntil', 'role', 'isActive']);
const FORBIDDEN_EVENT_FIELDS = new Set(['plan', 'premiumUntil', 'ownerId', 'status', 'slug']);

export function forbidPlanFieldsOnMe(req, res, next) {
  if (!req.body || typeof req.body !== 'object') return next();
  for (const key of Object.keys(req.body)) {
    if (FORBIDDEN_USER_FIELDS.has(key)) {
      delete req.body[key];
    }
  }
  next();
}

export function forbidPlanFieldsOnEvent(req, res, next) {
  if (!req.body || typeof req.body !== 'object') return next();
  for (const key of Object.keys(req.body)) {
    if (FORBIDDEN_EVENT_FIELDS.has(key)) {
      delete req.body[key];
    }
  }
  next();
}
