import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { requireAdminOrBootstrap } from '../middleware/role.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.schema.js';
import {
  register,
  login,
  logout,
  refresh,
  guestSession,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = Router();

// Inscription reservee aux administrateurs (amorcage du premier compte inclus).
router.post('/register', authLimiter, requireAdminOrBootstrap, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);

// Session invite pour les clients sans compte.
router.post('/guest', guestSession);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
