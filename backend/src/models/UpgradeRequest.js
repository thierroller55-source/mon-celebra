import mongoose from 'mongoose';
import { PLAN_IDS } from '../config/plans.js';

const UPGRADE_REQUEST_PLANS = [PLAN_IDS.EVENT_PASS, PLAN_IDS.PRO];
const UPGRADE_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const upgradeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    planRequested: {
      type: String,
      enum: UPGRADE_REQUEST_PLANS,
      required: true,
    },
    status: {
      type: String,
      enum: UPGRADE_REQUEST_STATUSES,
      default: 'pending',
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    payerPhone: { type: String, trim: true, maxlength: 30 },
    transactionRef: { type: String, trim: true, maxlength: 120 },
    amount: { type: Number, min: 0, default: null },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decidedAt: { type: Date, default: null },
    note: { type: String, trim: true, maxlength: 1000, default: null },
  },
  { timestamps: true },
);

upgradeRequestSchema.index({ userId: 1, createdAt: -1 });
upgradeRequestSchema.index({ status: 1, createdAt: -1 });

export const UpgradeRequest = mongoose.model('UpgradeRequest', upgradeRequestSchema);

export { UPGRADE_REQUEST_PLANS, UPGRADE_REQUEST_STATUSES };
