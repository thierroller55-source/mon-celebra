import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listNotifications,
  markRead,
  markAllRead,
  unreadCount,
} from '../controllers/notification.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.patch('/:id/read', markRead);
router.post('/read-all', markAllRead);

export default router;
