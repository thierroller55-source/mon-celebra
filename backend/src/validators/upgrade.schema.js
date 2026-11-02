import { z } from 'zod';
import { PLAN_IDS } from '../config/plans.js';

const phoneRegex = /^[+0-9\s-]{8,30}$/;

export const createUpgradeRequestSchema = z.object({
  planRequested: z.enum([PLAN_IDS.EVENT_PASS, PLAN_IDS.PRO]),
  eventId: z.string().trim().min(1).optional(),
  payerPhone: z.string().trim().regex(phoneRegex, 'Numero de paiement invalide.'),
  transactionRef: z.string().trim().min(3).max(120, 'Reference de transaction invalide.'),
  amount: z.coerce.number().int().min(0).optional(),
});

export const adminDecisionSchema = z.object({
  action: z.enum(['approve', 'reject', 'deactivate']),
  durationMonths: z.coerce.number().int().min(1).max(60).optional(),
  amount: z.coerce.number().int().min(0).optional(),
  paymentMethod: z.enum(['wave', 'orange_money', 'autre']).optional(),
  note: z.string().trim().max(1000).optional(),
  proUntil: z.coerce.date().optional(),
});

export const adminActivateWithoutRequestSchema = z.object({
  userId: z.string().trim().min(1),
  eventId: z.string().trim().min(1).optional(),
  planRequested: z.enum([PLAN_IDS.EVENT_PASS, PLAN_IDS.PRO]),
  durationMonths: z.coerce.number().int().min(1).max(60).optional(),
  proUntil: z.coerce.date().optional(),
  premiumUntil: z.coerce.date().optional(),
  amount: z.coerce.number().int().min(0).optional(),
  paymentMethod: z.enum(['wave', 'orange_money', 'autre']).optional(),
  note: z.string().trim().max(1000).optional(),
});
