import { Router } from 'express';
import { getEventSharePage } from '../controllers/share.controller.js';

const router = Router();

// Apercu Open Graph pour les robots sociaux (WhatsApp, Facebook, Telegram...).
router.get('/e/:slug', getEventSharePage);

export default router;
