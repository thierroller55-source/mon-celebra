import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { requireAdminOrBootstrap } from '../middleware/role.js';
import { verifyToken } from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.schema.js';
import {
  register,
  login,
  logout,
  refresh,
  guestSession,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller.js';

const router = Router();

// Inscription reservee aux administrateurs (amorcage du premier compte inclus).
router.post('/register', authLimiter, requireAdminOrBootstrap, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', authLimiter, refresh);

// Session invite pour les clients sans compte.
router.post('/guest', guestSession);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);

// Verification d'adresse email.
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', authLimiter, verifyToken, resendVerification);

export default router;
