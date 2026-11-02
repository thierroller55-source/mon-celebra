/**
 * Source unique de vérité pour les plans et leurs limites.
 * Configuration typée et modifiable, jamais de valeurs en dur ailleurs.
 */

export const PLAN_IDS = Object.freeze({
  FREE: 'free',
  EVENT_PASS: 'event_pass',
  PRO: 'pro',
  LEGACY: 'legacy',
} as const);

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS];

export const USER_PLANS = Object.freeze({
  FREE: PLAN_IDS.FREE,
  PRO: PLAN_IDS.PRO,
} as const);

export const EVENT_PLANS = Object.freeze({
  FREE: PLAN_IDS.FREE,
  EVENT_PASS: PLAN_IDS.EVENT_PASS,
} as const);

export const USER_PLAN_IDS = Object.freeze(Object.values(USER_PLANS));
export const EVENT_PLAN_IDS = Object.freeze(Object.values(EVENT_PLANS));

export const PUBLIC_PLAN_IDS = Object.freeze([
  PLAN_IDS.FREE,
  PLAN_IDS.EVENT_PASS,
  PLAN_IDS.PRO,
]);

export const GRACE_PERIOD_DAYS = 30;
export const DAY_MS = 86_400_000;

export const PLAN_CATALOG = Object.freeze({
  [PLAN_IDS.FREE]: Object.freeze({
    id: PLAN_IDS.FREE,
    scope: 'account',
    purchasable: false,
    nameKey: 'plans.free.name',
    descriptionKey: 'plans.free.description',
    priceFcfa: null,
    limits: Object.freeze({
      maxActiveEvents: 1,
      maxPhotosPerEvent: 5,
      maxGuestbookMessages: 10,
    }),
    features: Object.freeze({
      premiumTemplates: false,
      advancedRsvp: false,
      exportCsv: false,
      reminders: false,
      customQr: false,
      removeBranding: false,
      customLogo: false,
    }),
    retention: Object.freeze({
      onlineMonthsAfterEvent: 3,
      onlineWhileActive: false,
    }),
  }),

  [PLAN_IDS.EVENT_PASS]: Object.freeze({
    id: PLAN_IDS.EVENT_PASS,
    scope: 'event',
    purchasable: true,
    nameKey: 'plans.eventPass.name',
    descriptionKey: 'plans.eventPass.description',
    priceFcfa: 2500,
    limits: Object.freeze({
      maxActiveEvents: null,
      maxActiveEventsPerPass: 1,
      maxPhotosPerEvent: 20,
      maxGuestbookMessages: null,
    }),
    features: Object.freeze({
      premiumTemplates: true,
      advancedRsvp: true,
      exportCsv: true,
      reminders: true,
      customQr: true,
      removeBranding: true,
      customLogo: false,
    }),
    retention: Object.freeze({
      onlineMonthsAfterEvent: 12,
      onlineWhileActive: false,
    }),
  }),

  [PLAN_IDS.PRO]: Object.freeze({
    id: PLAN_IDS.PRO,
    scope: 'account',
    purchasable: true,
    nameKey: 'plans.pro.name',
    descriptionKey: 'plans.pro.description',
    priceFcfa: 3000,
    limits: Object.freeze({
      maxActiveEvents: 50,
      maxPhotosPerEvent: 20,
      maxGuestbookMessages: null,
    }),
    features: Object.freeze({
      premiumTemplates: true,
      advancedRsvp: true,
      exportCsv: true,
      reminders: true,
      customQr: true,
      removeBranding: true,
      customLogo: true,
    }),
    retention: Object.freeze({
      onlineMonthsAfterEvent: null,
      onlineWhileActive: true,
    }),
  }),

  [PLAN_IDS.LEGACY]: Object.freeze({
    id: PLAN_IDS.LEGACY,
    scope: 'event',
    purchasable: false,
    nameKey: 'plans.legacy.name',
    descriptionKey: 'plans.legacy.description',
    priceFcfa: null,
    limits: Object.freeze({
      maxActiveEvents: null,
      maxPhotosPerEvent: 20,
      maxGuestbookMessages: null,
    }),
    features: Object.freeze({
      premiumTemplates: true,
      advancedRsvp: true,
      exportCsv: true,
      reminders: false,
      customQr: false,
      removeBranding: true,
      customLogo: false,
    }),
    retention: Object.freeze({
      onlineMonthsAfterEvent: null,
      onlineWhileActive: true,
    }),
  }),
} as const);

export function getPlanDefinition(planId: string) {
  return PLAN_CATALOG[planId as keyof typeof PLAN_CATALOG] || PLAN_CATALOG[PLAN_IDS.FREE];
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function resolveExpiry(until: Date | string | null | undefined, now: Date) {
  if (!until) {
    return { active: true, inGrace: false, expiresAt: null, graceEndsAt: null };
  }

  const expiresAt = new Date(until);
  if (Number.isNaN(expiresAt.getTime())) {
    return { active: false, inGrace: false, expiresAt: null, graceEndsAt: null };
  }

  const graceEndsAt = addDays(expiresAt, GRACE_PERIOD_DAYS);
  if (expiresAt.getTime() > now.getTime()) {
    return { active: true, inGrace: false, expiresAt, graceEndsAt };
  }
  if (now.getTime() < graceEndsAt.getTime()) {
    return { active: true, inGrace: true, expiresAt, graceEndsAt };
  }
  return { active: false, inGrace: false, expiresAt, graceEndsAt };
}

function buildEntitlements(planId: string, expiry: any = {}) {
  const definition: any = getPlanDefinition(planId);
  return {
    plan: definition.id,
    scope: definition.scope,
    isPremium: definition.id !== PLAN_IDS.FREE,
    isLegacy: definition.id === PLAN_IDS.LEGACY,
    active: definition.id === PLAN_IDS.FREE || definition.id === PLAN_IDS.LEGACY
      ? true
      : Boolean(expiry.active),
    inGrace: Boolean(expiry.inGrace),
    expiresAt: expiry.expiresAt || null,
    graceEndsAt: expiry.graceEndsAt || null,
    limits: { ...definition.limits },
    features: { ...definition.features },
    retention: { ...definition.retention },
    definition,
  };
}

/**
 * Fonction pure renvoyant les droits effectifs (limites, fonctions autorisées, date d'expiration).
 * Tout le code l'utilise.
 */
export function getEntitlements(user: any = null, event: any = null, now: Date = new Date()) {
  const referenceDate = now instanceof Date ? now : new Date(now);

  if (event?.legacy) {
    return buildEntitlements(PLAN_IDS.LEGACY);
  }

  const userPlan = user?.plan === 'premium' ? USER_PLANS.PRO : user?.plan;
  if (userPlan === USER_PLANS.PRO) {
    const until = user?.proUntil ?? user?.premiumUntil ?? null;
    const expiry = resolveExpiry(until, referenceDate);
    if (expiry.active) {
      return buildEntitlements(PLAN_IDS.PRO, expiry);
    }
  }

  if (event?.plan === EVENT_PLANS.EVENT_PASS) {
    const expiry = resolveExpiry(event.premiumUntil, referenceDate);
    if (expiry.active) {
      return buildEntitlements(PLAN_IDS.EVENT_PASS, expiry);
    }
  }

  return buildEntitlements(PLAN_IDS.FREE);
}

export function isPremiumActive(user: any, event: any = null, now: Date = new Date()) {
  return getEntitlements(user, event, now).isPremium;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function getRetentionEndsAt(entitlements: any, event: any) {
  const retention = entitlements?.retention;
  if (!retention || retention.onlineWhileActive || !retention.onlineMonthsAfterEvent) {
    return null;
  }

  const anchor = event?.date || event?.publishedAt || event?.createdAt;
  if (!anchor) return null;

  const start = new Date(anchor);
  if (Number.isNaN(start.getTime())) return null;

  return addMonths(start, retention.onlineMonthsAfterEvent);
}

export function isEventRetained(entitlements: any, event: any, now: Date = new Date()) {
  const endsAt = getRetentionEndsAt(entitlements, event);
  if (!endsAt) return true;

  const referenceDate = now instanceof Date ? now : new Date(now);
  return endsAt.getTime() > referenceDate.getTime();
}

export function getActiveEventLimit(entitlements: any, activePassCount = 0) {
  const limit = entitlements?.limits?.maxActiveEvents;
  if (limit === null || limit === undefined) return null;
  if (entitlements.plan === PLAN_IDS.PRO) return limit;

  const passes = Number.isFinite(activePassCount) ? Math.max(0, activePassCount) : 0;
  return limit + passes;
}
