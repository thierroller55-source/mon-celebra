import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Envoie un email transactionnel via l'API Brevo.
 * @param {{ to: string, subject: string, html: string, text?: string, replyTo?: string }} options
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!env.brevo.enabled) {
    logger.warn(`BREVO_API_KEY absent : email non envoye ("${subject}" -> ${to}).`);
    return { skipped: true };
  }

  const payload = {
    sender: { email: env.brevo.from, name: env.brevo.fromName },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  };

  const replyToEmail = replyTo || env.brevo.replyTo;
  if (replyToEmail) payload.replyTo = { email: replyToEmail };

  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': env.brevo.apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Brevo a refuse l'envoi (${response.status}) ${detail}`.trim());
  }

  logger.info(`Email envoye via Brevo : "${subject}" -> ${to}`);
  return response.json().catch(() => ({}));
}

/**
 * Variante tolerante aux erreurs : l'echec d'un email ne doit jamais faire
 * echouer la requete HTTP appelante (inscription, reinitialisation...).
 */
export async function sendEmailSafe(options) {
  try {
    return await sendEmail(options);
  } catch (error) {
    logger.error(`Echec de l'envoi d'email : ${error.message}`);
    return { error: true };
  }
}
