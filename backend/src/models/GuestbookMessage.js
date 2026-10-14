import mongoose from 'mongoose';
import { GUESTBOOK_STATUS } from '../config/constants.js';
import { imageSchema } from './shared.js';

const guestbookMessageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    photo: { type: imageSchema, default: undefined },
    status: {
      type: String,
      enum: Object.values(GUESTBOOK_STATUS),
      default: GUESTBOOK_STATUS.PENDING,
      index: true,
    },
    ipHash: { type: String, default: null },
  },
  { timestamps: true },
);

guestbookMessageSchema.index({ eventId: 1, status: 1, createdAt: -1 });

export const GuestbookMessage = mongoose.model(
  'GuestbookMessage',
  guestbookMessageSchema,
);
