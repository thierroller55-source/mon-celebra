import { Router } from 'express';
import { publicWriteLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { uploadSingle } from '../middleware/upload.js';
import { rsvpSchema } from '../validators/rsvp.schema.js';
import { guestbookSchema } from '../validators/guestbook.schema.js';
import { reportSchema } from '../validators/report.schema.js';
import {
  getPublicEvent,
  createRsvp,
  createGuestbookMessage,
  createReport,
  getEventCalendar,
} from '../controllers/public.controller.js';

const router = Router();

router.get('/events/:slug', getPublicEvent);
router.get('/events/:slug/calendar.ics', getEventCalendar);
router.post('/events/:slug/rsvp', publicWriteLimiter, validate(rsvpSchema), createRsvp);
router.post(
  '/events/:slug/guestbook',
  publicWriteLimiter,
  uploadSingle,
  validate(guestbookSchema),
  createGuestbookMessage,
);

export default router;
