import crypto from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Hash non reversible de l'IP (anti-spam / anti-doublon) sans stocker l'IP
 * en clair. Le secret evite les tables arc-en-ciel.
 */
export function hashIp(ip) {
  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(String(ip ?? 'unknown'))
    .digest('hex');
}
