import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { sendEmailSafe } from './mailer.service.js';
import { verifyEmailTemplate } from './emailTemplates.js';
import { createEmailVerificationToken } from './auth.service.js';

/**
 * Genere un jeton de verification et envoie l'email correspondant a `email`.
 * Utilise a l'inscription, au renvoi de verification et au changement
 * d'adresse email (y compris la conversion d'un compte invite).
 *
 * Best-effort : n'echoue jamais la requete appelante.
 */
export async function sendEmailVerification(user, email = user.email) {
  if (!user || !email) return null;

  const { token, tokenHash, expiresAt } = createEmailVerificationToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: expiresAt } },
  );

  const verifyUrl = `${env.clientUrl}/verifier-email/${token}`;
  const { subject, html } = verifyEmailTemplate({ name: user.firstName, verifyUrl });
  await sendEmailSafe({ to: email, subject, html });

  return token;
}
