import mongoose from 'mongoose';
import { RSVP_RESPONSE } from '../config/constants.js';

const rsvpSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
    guestsCount: { type: Number, default: 1, min: 1, max: 50 },
    response: {
      type: String,
      enum: Object.values(RSVP_RESPONSE),
      required: true,
    },
    message: { type: String, trim: true, maxlength: 500 },
    ipHash: { type: String, default: null },
  },
  { timestamps: true },
);

rsvpSchema.index({ eventId: 1, createdAt: -1 });

export const Rsvp = mongoose.model('Rsvp', rsvpSchema);
