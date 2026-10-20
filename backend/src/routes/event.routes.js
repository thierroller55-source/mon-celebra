import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireEventOwner } from '../middleware/ownership.js';
import { validate } from '../middleware/validate.js';
import { uploadMultiple, uploadPoster } from '../middleware/upload.js';
import { createEventSchema, updateEventSchema } from '../validators/event.schema.js';
import { guestbookModerationSchema } from '../validators/guestbook.schema.js';
import { hostRsvpResponseSchema } from '../validators/rsvp.schema.js';
import {
  listEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  addPhotos,
  removePhoto,
  listRsvp,
  exportRsvp,
  respondRsvp,
  listGuestbook,
  moderateGuestbook,
  deleteGuestbookMessage,
  duplicateEvent,
  archiveEvent,
  unarchiveEvent,
  uploadMainImage,
  deleteMainImage,
  getEventPoster,
} from '../controllers/event.controller.js';
import { getEventQr } from '../controllers/qrcode.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', listEvents);
router.post('/', validate(createEventSchema), createEvent);

router.get('/:id', requireEventOwner, getEvent);
router.put('/:id', requireEventOwner, validate(updateEventSchema), updateEvent);
router.delete('/:id', requireEventOwner, deleteEvent);

router.post('/:id/publish', requireEventOwner, publishEvent);
router.post('/:id/unpublish', requireEventOwner, unpublishEvent);

router.post('/:id/photos', requireEventOwner, uploadMultiple, addPhotos);
router.delete('/:id/photos/:photoId', requireEventOwner, removePhoto);

router.post('/:id/main-image', requireEventOwner, uploadPoster, uploadMainImage);
router.delete('/:id/main-image', requireEventOwner, deleteMainImage);
router.get('/:id/poster', requireEventOwner, getEventPoster);

router.get('/:id/rsvp', requireEventOwner, listRsvp);
router.get('/:id/rsvp/export', requireEventOwner, exportRsvp);
router.patch(
  '/:id/rsvp/:rsvpId/reply',
  requireEventOwner,
  validate(hostRsvpResponseSchema),
  respondRsvp,
);

router.get('/:id/guestbook', requireEventOwner, listGuestbook);
router.patch(
  '/:id/guestbook/:msgId',
  requireEventOwner,
  validate(guestbookModerationSchema),
  moderateGuestbook,
);
router.delete('/:id/guestbook/:msgId', requireEventOwner, deleteGuestbookMessage);

router.post('/:id/duplicate', requireEventOwner, duplicateEvent);
router.post('/:id/archive', requireEventOwner, archiveEvent);
router.post('/:id/unarchive', requireEventOwner, unarchiveEvent);

router.get('/:id/qrcode', requireEventOwner, getEventQr);

export default router;
