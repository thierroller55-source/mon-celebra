import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import meRoutes from './me.routes.js';
import publicRoutes from './public.routes.js';
import uploadRoutes from './upload.routes.js';
import eventRoutes from './event.routes.js';
import categoryRoutes from './category.routes.js';
import templateRoutes from './template.routes.js';
import reportRoutes from './report.routes.js';
import adminRoutes from './admin.routes.js';
import geoRoutes from './geo.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Ping instantane, sans aucun acces base : sert au keep-alive (anti veille
// Render) et au diagnostic. Repond en quelques millisecondes meme a froid.
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    db: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
});

router.head('/health', (req, res) => res.status(204).end());

// Auth & profil
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/me', meRoutes);

// Evenements (organisateur, authentifie)
router.use('/events', eventRoutes);

// Upload d'images (authentifie)
router.use('/uploads', uploadRoutes);

// Catalogue (public)
router.use('/categories', categoryRoutes);
router.use('/templates', templateRoutes);

// Public (invites)
router.use('/public', publicRoutes);
router.use('/reports', reportRoutes);
router.use('/geo', geoRoutes);
router.use('/notifications', notificationRoutes);

// Administration
router.use('/admin', adminRoutes);

export default router;
