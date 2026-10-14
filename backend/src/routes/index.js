import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    db: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Les routeurs metier sont montes ici au fur et a mesure des etapes :
// router.use('/auth', authRoutes);
// router.use('/events', eventRoutes);
// ...

export default router;
