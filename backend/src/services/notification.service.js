import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';

/**
 * Cree une notification in-app pour l'organisateur. Les erreurs de
 * notification ne doivent jamais faire echouer l'action principale.
 */
export async function notify({ userId, type = 'system', title, message, link = null }) {
  try {
    await Notification.create({ userId, type, title, message, link });
  } catch (error) {
    logger.warn(`Notification non creee : ${error.message}`);
  }
}
