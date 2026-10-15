import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../config/constants.js';
import {
  REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
  signAccessToken,
  verifyRefreshToken,
  createResetToken,
  hashResetToken,
  createEmailVerificationToken,
} from '../services/auth.service.js';
import { sendEmailSafe } from '../services/mailer.service.js';
import { resetPasswordTemplate, verifyEmailTemplate } from '../services/emailTemplates.js';

function authPayload(user) {
  return { user: user.toJSON(), accessToken: signAccessToken(user) };
}

/**
 * Genere un token de verification et envoie l'email correspondant.
 * N'echoue jamais la requete appelante (l'email est best-effort).
 */
async function sendVerificationEmail(user) {
  if (!user?.email || user.isGuest) return;
  const { token, tokenHash, expiresAt } = createEmailVerificationToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: expiresAt } },
  );
  const verifyUrl = `${env.clientUrl}/verifier-email/${token}`;
  const { subject, html } = verifyEmailTemplate({ name: user.firstName, verifyUrl });
  await sendEmailSafe({ to: user.email, subject, html });
}

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('Un compte existe deja avec cet email.', 'EMAIL_TAKEN');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    phone,
    role: ROLES.ADMIN,
  });

  // Verification d'email (best-effort : ne bloque pas la creation du compte).
  await sendVerificationEmail(user);

  // Amorcage : aucun admin n'existait, on ouvre directement la session.
  // Sinon un admin cree un collegue : on ne pas touche pas a sa session.
  if (!req.user) {
    setRefreshCookie(res, user);
    return res.status(201).json({ success: true, data: authPayload(user) });
  }

  return res.status(201).json({ success: true, data: { user: user.toJSON() } });
});

/**
 * Ouvre une session "invite" pour un client sans compte : reutilise la session
 * existante si un refresh cookie valide est present, sinon cree un compte
 * anonyme (isGuest) afin que l'organisateur puisse gerer ses evenements.
 */
export const guestSession = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const existing = await User.findById(payload.sub);
      if (existing && existing.isActive) {
        setRefreshCookie(res, existing);
        return res.json({ success: true, data: authPayload(existing) });
      }
    } catch {
      // Cookie invalide : on repart sur une nouvelle session invite.
    }
  }

  const email = `guest_${crypto.randomUUID()}@guest.moncelebra.local`;
  const passwordHash = await User.hashPassword(crypto.randomBytes(24).toString('hex'));
  const user = await User.create({
    firstName: 'Invite',
    lastName: 'Anonyme',
    email,
    passwordHash,
    isGuest: true,
    emailVerified: false,
  });

  setRefreshCookie(res, user);
  return res.status(201).json({ success: true, data: authPayload(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const validPassword = user ? await user.comparePassword(password) : false;

  if (!user || !validPassword) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect.', 'INVALID_CREDENTIALS');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Ce compte est desactive.', 'ACCOUNT_DISABLED');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, user);
  res.json({ success: true, data: authPayload(user) });
});

export const logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  res.json({ success: true, data: { message: 'Deconnexion reussie.' } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('Session absente.', 'NO_REFRESH_TOKEN');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session expiree. Reconnectez-vous.', 'SESSION_EXPIRED');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session invalide.', 'INVALID_SESSION');
  }

  setRefreshCookie(res, user);
  res.json({ success: true, data: { user: user.toJSON(), accessToken: signAccessToken(user) } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const { token, tokenHash, expiresAt } = createResetToken();
    await User.updateOne(
      { _id: user._id },
      { $set: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt } },
    );

    const resetUrl = `${env.clientUrl}/reinitialiser-mot-de-passe/${token}`;
    // En dev, on expose le lien dans les logs (pratique sans boite mail).
    if (!env.isProduction) logger.info(`Lien de reinitialisation : ${resetUrl}`);

    const { subject, html } = resetPasswordTemplate({ name: user.firstName, resetUrl });
    await sendEmailSafe({ to: user.email, subject, html });
  }

  // Reponse identique qu'un compte existe ou non (anti-enumeration).
  res.json({
    success: true,
    data: { message: 'Si un compte existe, un lien de reinitialisation a ete envoye.' },
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const tokenHash = hashResetToken(token);

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

  if (!user) {
    throw ApiError.badRequest('Lien de verification invalide ou expire.', 'INVALID_VERIFICATION_TOKEN');
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, data: { message: 'Votre adresse email est confirmee.' } });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isActive) throw ApiError.unauthorized();

  if (user.emailVerified) {
    return res.json({ success: true, data: { message: 'Cet email est deja confirme.' } });
  }

  await sendVerificationEmail(user);
  res.json({ success: true, data: { message: 'Email de confirmation renvoye.' } });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const tokenHash = hashResetToken(req.params.token);

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExpiresAt');

  if (!user) {
    throw ApiError.badRequest('Lien invalide ou expire.', 'INVALID_RESET_TOKEN');
  }

  user.passwordHash = await User.hashPassword(password);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  clearRefreshCookie(res);
  res.json({ success: true, data: { message: 'Mot de passe mis a jour.' } });
});
