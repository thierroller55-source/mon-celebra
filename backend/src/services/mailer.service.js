import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { EmailLog } from '../models/EmailLog.js';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/** Masque un email pour les logs : "j***@gmail.com". */
export function maskEmail(email) {
  const value = String(email || '');
  const at = value.indexOf('@');
  if (at <= 0) return '***';
  return `${value[0]}***${value.slice(at)}`;
}

async function writeLog(entry) {
  try {
    await EmailLog.create(entry);
  } catch (error) {
    logger.warn(`Impossible d'enregistrer le journal email : ${error.message}`);
  }
}

/**
 * Envoie un email transactionnel via l'API Brevo.
 *
 * `type` sert au journal (verify_email, reset_password, test...).
 * Cette fonction PROPAGE toute erreur du fournisseur : l'appelant peut ainsi
 * repondre honnetement (502) au lieu d'annoncer un faux succes.
 *
 * @param {{ to: string, subject: string, html: string, text?: string, replyTo?: string, type?: string }} options
 * @returns {Promise<{ skipped?: true, messageId?: string }>}
 */
export async function sendEmail({ to, subject, html, text, replyTo, type = 'other' }) {
  if (!env.brevo.enabled) {
    logger.warn(`BREVO_API_KEY absent : email non envoye ("${subject}" -> ${maskEmail(to)}).`);
    await writeLog({
      type,
      recipient: maskEmail(to),
      status: 'skipped',
      errorCode: 'NO_PROVIDER',
      errorMessage: 'BREVO_API_KEY non configuree.',
    });
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

  let response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': env.brevo.apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Erreur reseau (Brevo injoignable, DNS, timeout...).
    logger.error(`Brevo injoignable : ${error.message}`);
    await writeLog({
      type,
      recipient: maskEmail(to),
      status: 'failed',
      errorCode: 'NETWORK',
      errorMessage: error.message,
    });
    throw new Error('Le service d\'email est injoignable pour le moment.');
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    // On journalise le detail cote serveur, jamais renvoye tel quel au client.
    logger.error(`Brevo a refuse l'envoi (${response.status}) ${detail}`.trim());
    await writeLog({
      type,
      recipient: maskEmail(to),
      status: 'failed',
      errorCode: String(response.status),
      errorMessage: detail.slice(0, 500),
    });
    const error = new Error("L'email n'a pas pu etre envoye par le fournisseur.");
    error.status = 502;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  logger.info(`Email envoye via Brevo : "${subject}" -> ${maskEmail(to)}`);
  await writeLog({
    type,
    recipient: maskEmail(to),
    status: 'sent',
    providerMessageId: data?.messageId,
  });
  return data;
}

/**
 * Variante tolerante : l'echec d'un email ne doit jamais faire echouer la
 * requete appelante (inscription, reinitialisation...). Le resultat indique
 * neanmoins clairement le succes ou l'echec.
 */
export async function sendEmailSafe(options) {
  try {
    const result = await sendEmail(options);
    return { ok: !result?.skipped, skipped: result?.skipped, ...result };
  } catch (error) {
    return { ok: false, error: true, message: error.message };
  }
}
