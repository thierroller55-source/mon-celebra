import mongoose from 'mongoose';
import { RSVP_RESPONSE, RSVP_HOST_RESPONSE } from '../config/constants.js';

const rsvpSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    // Compte Mon Celebra du visiteur qui confirme sa presence (obligatoire).
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Snapshot des informations du compte au moment de la reponse. Le nom est
    // conserve pour l'affichage et l'export meme si le compte est modifie.
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 30 },
    guestsCount: { type: Number, default: 1, min: 1, max: 50 },
    response: {
      type: String,
      enum: Object.values(RSVP_RESPONSE),
      required: true,
    },
    message: { type: String, trim: true, maxlength: 500 },
    // Reponse de l'hote (accepte / refuse) visible par le visiteur.
    hostResponse: {
      type: String,
      enum: Object.values(RSVP_HOST_RESPONSE),
      default: null,
    },
    hostRespondedAt: { type: Date, default: null },
    ipHash: { type: String, default: null },
  },
  { timestamps: true },
);

rsvpSchema.index({ eventId: 1, createdAt: -1 });
// Un seul RSVP par visiteur et par evenement (upsert).
rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Rsvp = mongoose.model('Rsvp', rsvpSchema);
