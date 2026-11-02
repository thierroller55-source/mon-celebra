import {
  DAY_MS,
  EVENT_PLANS,
  GRACE_PERIOD_DAYS,
  getActiveEventLimit,
  getEntitlements as resolveEntitlements,
  getRetentionEndsAt,
  isEventRetained,
} from '../config/plans.js';
import { EVENT_STATUS } from '../config/constants.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';

const ACTIVE_EVENT_STATUSES = [
  EVENT_STATUS.DRAFT,
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.UNPUBLISHED,
];

/** Retourne les droits effectifs pour un compte et, si fourni, un evenement. */
export function getEntitlements(user, event = null, now = new Date()) {
  return resolveEntitlements(user, event, now);
}

export function isPremiumActive(user, event = null, now = new Date()) {
  return getEntitlements(user, event, now).isPremium;
}

export function getPlan(user, event = null, now = new Date()) {
  return getEntitlements(user, event, now).plan;
}

export async function getUserEntitlements(userId, now = new Date()) {
  const user = await User.findById(userId).select('plan proUntil premiumUntil');
  return getEntitlements(user, null, now);
}

/** Charge le proprietaire pour appliquer le bon plan a un evenement. */
export async function getEventEntitlements(event, now = new Date()) {
  if (!event) return getEntitlements(null, null, now);

  const owner = event.ownerId
    ? await User.findById(event.ownerId).select('plan proUntil premiumUntil')
    : null;
  return getEntitlements(owner, event, now);
}

/**
 * Compte les Pass Evenement encore actifs (grace incluse) pour attribuer les
 * emplacements supplementaires du quota gratuit.
 */
export async function countActiveEventPasses(ownerId, now = new Date()) {
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * DAY_MS);

  return Event.countDocuments({
    ownerId,
    plan: EVENT_PLANS.EVENT_PASS,
    status: { $in: ACTIVE_EVENT_STATUSES },
    $or: [{ premiumUntil: null }, { premiumUntil: { $gt: graceCutoff } }],
  });
}

export { getActiveEventLimit, getRetentionEndsAt, isEventRetained };
