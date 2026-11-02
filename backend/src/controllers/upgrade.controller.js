import crypto from 'node:crypto';
import { UpgradeRequest } from '../models/UpgradeRequest.js';
import { PlanAudit } from '../models/PlanAudit.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PLAN_IDS, USER_PLANS } from '../config/plans.js';
import { env } from '../config/env.js';
import { Notification } from '../models/Notification.js';
import { sendEmail } from '../services/mailer.service.js';

function generateReference() {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CEL-${bytes}`;
}

function buildSnapshot(user, event = null) {
  return {
    userPlan: user.plan,
    proUntil: user.proUntil,
    eventPlan: event?.plan || null,
    premiumUntil: event?.premiumUntil || null,
  };
}

export const getPaymentInfo = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      waveLink: env.payments?.waveLink || null,
      orangeNumber: env.payments?.orangeNumber || null,
      whatsapp: env.contact?.whatsapp || null,
    },
  });
});

export const createUpgradeRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { eventId, planRequested, payerPhone, transactionRef, amount } = req.body;

  if (!Object.values([PLAN_IDS.EVENT_PASS, PLAN_IDS.PRO]).includes(planRequested)) {
    throw ApiError.badRequest('Offre invalide.');
  }

  if (planRequested === PLAN_IDS.EVENT_PASS && !eventId) {
    throw ApiError.badRequest("Un evenement est requis pour un Pass Evenement.");
  }

  const existing = await UpgradeRequest.findOne({
    userId,
    status: 'pending',
    ...(planRequested === PLAN_IDS.EVENT_PASS ? { eventId } : { planRequested: PLAN_IDS.PRO, eventId: null }),
  });
  if (existing) {
    throw ApiError.conflict('Une demande en attente existe deja pour cette offre.', 'UPGRADE_REQUEST_EXISTS');
  }

  let reference;
  for (let i = 0; i < 10; i += 1) {
    reference = generateReference();
    const exists = await UpgradeRequest.findOne({ reference });
    if (!exists) break;
  }
  if (!reference) throw ApiError.internal('Impossible de generer une reference.');

  const request = await UpgradeRequest.create({
    userId,
    eventId: planRequested === PLAN_IDS.EVENT_PASS ? eventId : null,
    planRequested,
    status: 'pending',
    reference,
    payerPhone,
    transactionRef,
    amount: amount ?? null,
  });

  res.status(201).json({ success: true, data: { request } });
});

export const listMyUpgradeRequests = asyncHandler(async (req, res) => {
  const requests = await UpgradeRequest.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate('eventId', 'title slug');
  res.json({ success: true, data: { requests } });
});
