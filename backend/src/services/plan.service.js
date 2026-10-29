import { PLANS, PLAN_LIMITS } from '../config/constants.js';

/** Un plan Premium expire automatiquement a `premiumUntil` (null = a vie). */
export function isPremiumActive(user) {
  if (!user || user.plan !== PLANS.PREMIUM) return false;
  if (!user.premiumUntil) return true;
  return new Date(user.premiumUntil).getTime() > Date.now();
}

export function getPlan(user) {
  return isPremiumActive(user) ? PLANS.PREMIUM : PLANS.FREE;
}

/**
 * Retourne la formule effective et ses avantages. Les comptes sans champ
 * `plan` (donnees anterieures) sont traites comme gratuits.
 */
export function getEntitlements(user) {
  const plan = getPlan(user);
  return {
    plan,
    isPremium: plan === PLANS.PREMIUM,
    limits: PLAN_LIMITS[plan],
  };
}
