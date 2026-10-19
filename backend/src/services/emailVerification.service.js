import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { sendEmail } from './mailer.service.js';
import { verifyEmailTemplate } from './emailTemplates.js';
import { createEmailVerificationToken } from './auth.service.js';

export const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * Genere un jeton de verification et envoie l'email correspondant a `email`.
 * Utilise a l'inscription, au renvoi de verification et au changement
 * d'adresse email (y compris la conversion d'un compte invite).
 *
 * `strict` (renvoi manuel) : propage les erreurs pour repondre 502 au client.
 * Sinon (inscription) : best-effort, l'echec est signale mais n'interrompt rien.
 *
 * @returns {Promise<{ ok: boolean, skipped?: boolean, providerMessageId?: string, message?: string }>}
 */
export async function sendEmailVerification(user, email = user.email, { strict = false } = {}) {
  if (!user || !email) return { ok: false, message: 'Destinataire manquant.' };

  const { token, tokenHash, expiresAt } = createEmailVerificationToken();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
        emailVerificationSentAt: new Date(),
      },
    },
  );

  const verifyUrl = `${env.clientUrl}/verifier-email/${token}`;
  const { subject, html, text } = verifyEmailTemplate({
    name: user.firstName,
    verifyUrl,
    locale: user.language,
  });

  try {
    const result = await sendEmail({ to: email, subject, html, text, type: 'verify_email' });
    return { ok: !result?.skipped, skipped: result?.skipped, providerMessageId: result?.messageId };
  } catch (error) {
    if (strict) throw error;
    return { ok: false, message: error.message };
  }
}

/**
 * Indique si un nouvel envoi est autorise (anti-spam : 60 s entre deux renvois).
 * @returns {{ allowed: boolean, retryAfterSeconds: number }}
 */
export function canResendVerification(user) {
  const last = user?.emailVerificationSentAt ? new Date(user.emailVerificationSentAt).getTime() : 0;
  if (!last) return { allowed: true, retryAfterSeconds: 0 };
  const elapsed = Date.now() - last;
  if (elapsed >= RESEND_COOLDOWN_MS) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
}
