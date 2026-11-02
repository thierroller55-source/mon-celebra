import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntitlements, PLAN_IDS } from '../src/config/plans.js';

test('free user gets free entitlements', () => {
  const ent = getEntitlements({ plan: 'free' }, null);
  assert.equal(ent.plan, PLAN_IDS.FREE);
  assert.equal(ent.limits.maxPhotosPerEvent, 5);
  assert.equal(ent.limits.maxGuestbookMessages, 10);
});

test('pro active', () => {
  const ent = getEntitlements({ plan: 'pro', proUntil: new Date(Date.now() + 86400000) }, null);
  assert.equal(ent.plan, PLAN_IDS.PRO);
  assert.equal(ent.features.customQr, true);
});

test('pro expired in grace', () => {
  const ent = getEntitlements({ plan: 'pro', proUntil: new Date(Date.now() - 5 * 86400000) }, null);
  assert.equal(ent.plan, PLAN_IDS.PRO);
  assert.equal(ent.inGrace, true);
});

test('pro expired after grace', () => {
  const ent = getEntitlements({ plan: 'pro', proUntil: new Date(Date.now() - 40 * 86400000) }, null);
  assert.equal(ent.plan, PLAN_IDS.FREE);
});

test('event pass active', () => {
  const ent = getEntitlements({ plan: 'free' }, { plan: 'event_pass', premiumUntil: new Date(Date.now() + 86400000) });
  assert.equal(ent.plan, PLAN_IDS.EVENT_PASS);
});

test('event pass expired', () => {
  const ent = getEntitlements({ plan: 'free' }, { plan: 'event_pass', premiumUntil: new Date(Date.now() - 40 * 86400000) });
  assert.equal(ent.plan, PLAN_IDS.FREE);
});

test('legacy event keeps features', () => {
  const ent = getEntitlements({ plan: 'free' }, { legacy: true });
  assert.equal(ent.plan, PLAN_IDS.LEGACY);
  assert.equal(ent.features.removeBranding, true);
});
