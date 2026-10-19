import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const REFRESH_COOKIE = 'refreshToken';

/** Convertit une duree JWT ("15m", "7d") en millisecondes. */
function parseDuration(value, fallbackMs) {
  const match = /^(\d+)\s*([smhd])?$/.exec(String(value ?? '').trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2] || 's';
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return amount * factor;
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, type: 'refresh' },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN },
  );
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
}

/**
 * Options du cookie httpOnly qui transporte le refresh token.
 *
 * En production l'API est exposee via un proxy same-origin (rewrite Vercel
 * `/api/*` -> backend), donc le cookie est "first-party" et peut rester en
 * "SameSite=Lax" : il survit aux limitations de cookies tiers de Safari/iOS.
 * COOKIE_SAMESITE=none reste disponible si le front et l'API sont servis sur
 * des domaines totalement distincts sans proxy.
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.COOKIE_SAMESITE || 'lax',
    path: '/',
    maxAge: parseDuration(env.REFRESH_TOKEN_EXPIRES_IN, 30 * 86_400_000),
  };
}

export function setRefreshCookie(res, user) {
  res.cookie(REFRESH_COOKIE, signRefreshToken(user), refreshCookieOptions());
}

export function clearRefreshCookie(res) {
  // On nettoie aussi l'ancien chemin (/api/auth) pour eviter un cookie
  // residuel qui maintiendrait une session fantome apres deploiement.
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), path: '/api/auth', maxAge: undefined });
}

/** Hash + expiration du token de reinitialisation de mot de passe. */
export function createResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Hash + expiration du token de verification d'adresse email (24h). */
export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}
