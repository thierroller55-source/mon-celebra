export const PLAN_ERROR_CODES = Object.freeze({
  PLAN_LIMIT_EVENTS: 'PLAN_LIMIT_EVENTS',
  PLAN_LIMIT_PHOTOS: 'PLAN_LIMIT_PHOTOS',
  PLAN_LIMIT_GUESTBOOK: 'PLAN_LIMIT_GUESTBOOK',
  PLAN_FEATURE_LOCKED: 'PLAN_FEATURE_LOCKED',
  UPGRADE_REQUEST_EXISTS: 'UPGRADE_REQUEST_EXISTS',
  UPGRADE_REQUEST_ALREADY_DECIDED: 'UPGRADE_REQUEST_ALREADY_DECIDED',
});

export function planLimitEventsMessage(limit) {
  return `Limite de ${limit} événements actifs atteinte.`;
}

export function planLimitPhotosMessage(limit) {
  return `Limite de ${limit} photos par événement atteinte.`;
}

export function planLimitGuestbookMessage(limit) {
  return `Limite de ${limit} messages dans le livre d'or atteinte.`;
}

export function planFeatureLockedMessage(feature) {
  return `Cette fonctionnalité est réservée aux formules payantes.`;
}
