import mongoose from 'mongoose';

/**
 * Journal des envois d'emails transactionnels. Ne contient JAMAIS de jeton ni
 * de contenu sensible : seulement le type, le destinataire masque, le statut et
 * l'identifiant / code d'erreur renvoye par le fournisseur (Brevo).
 */
const emailLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['verify_email', 'reset_password', 'test', 'other'],
      default: 'other',
      index: true,
    },
    recipient: { type: String, required: true },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped'],
      required: true,
      index: true,
    },
    provider: { type: String, default: 'brevo' },
    providerMessageId: { type: String },
    errorCode: { type: String },
    errorMessage: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

export const EmailLog = mongoose.model('EmailLog', emailLogSchema);
