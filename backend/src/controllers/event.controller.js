import { Event } from '../models/Event.js';
import { Rsvp } from '../models/Rsvp.js';
import { GuestbookMessage } from '../models/GuestbookMessage.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as eventService from '../services/event.service.js';
import * as posterService from '../services/poster.service.js';
import { fetchImageBytes } from '../services/storage.service.js';
import { notify } from '../services/notification.service.js';
import { getEventEntitlements } from '../services/plan.service.js';

export const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { events } });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.user.id, req.body);
  res.status(201).json({ success: true, data: { event } });
});

export const getEvent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { event: req.event } });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.event, req.body);
  res.json({ success: true, data: { event } });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.event);
  res.json({ success: true, data: { message: 'Evenement supprime.' } });
});

export const publishEvent = asyncHandler(async (req, res) => {
  const event = await eventService.publishEvent(req.event);
  res.json({ success: true, data: { event } });
});

export const unpublishEvent = asyncHandler(async (req, res) => {
  const event = await eventService.unpublishEvent(req.event);
  res.json({ success: true, data: { event } });
});

export const uploadMainImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucune affiche recue.', 'NO_FILE');
  }
  const event = await eventService.setMainImage(req.event, req.file);
  res.status(201).json({ success: true, data: { event } });
});

export const deleteMainImage = asyncHandler(async (req, res) => {
  const event = await eventService.removeMainImage(req.event);
  res.json({ success: true, data: { event } });
});

const POSTER_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function sendPosterBuffer(res, buffer, publicId, url, cache = 'private, max-age=300') {
  const ext = (publicId || url || '').split('.').pop().toLowerCase();
  res.set('Content-Type', POSTER_MIME[ext] || 'application/octet-stream');
  res.set('Cache-Control', cache);
  res.send(buffer);
}

/** Restitue les octets de l'affiche source via l'API (same-origin, sans CORS). */
export const getEventPoster = asyncHandler(async (req, res) => {
  const image =
    (req.event.poster?.sourceUrl && {
      url: req.event.poster.sourceUrl,
      publicId: req.event.poster.sourcePublicId,
    }) ||
    req.event.mainImage;
  if (!image?.url) {
    throw ApiError.notFound("Aucune affiche pour cet evenement.", 'NO_POSTER');
  }

  const buffer = await fetchImageBytes(image);
  sendPosterBuffer(res, buffer, image.publicId, image.url);
});

/** Restitue l'image composee (celle qui sera telechargee). */
export const getComposedPoster = asyncHandler(async (req, res) => {
  const image = req.event.poster;
  if (!image?.composedUrl) {
    throw ApiError.notFound("Aucune affiche composee pour cet evenement.", 'NO_COMPOSED_POSTER');
  }

  const buffer = await fetchImageBytes({
    url: image.composedUrl,
    publicId: image.composedPublicId,
  });
  sendPosterBuffer(res, buffer, image.composedPublicId, image.composedUrl);
});

export const uploadEventPoster = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucune affiche recue.', 'NO_FILE');
  }

  const entitlements = await getEventEntitlements(req.event);
  const maxBytes = (entitlements.limits.maxPosterFileMb || 8) * 1024 * 1024;
  const result = await posterService.importEventPoster(req.event, req.file, {
    qr: req.body.qr,
    maxBytes,
  });

  res.status(201).json({
    success: true,
    data: {
      event: result.event,
      posterQrReadable: result.qrReadable,
    },
  });
});

export const updateEventPosterSettings = asyncHandler(async (req, res) => {
  const result = await posterService.updateEventPosterSettings(req.event, req.body);
  res.json({
    success: true,
    data: {
      event: result.event,
      posterQrReadable: result.qrReadable,
    },
  });
});

export const deleteEventPoster = asyncHandler(async (req, res) => {
  const event = await posterService.removeEventPoster(req.event);
  res.json({ success: true, data: { event } });
});

export const addPhotos = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    throw ApiError.badRequest('Aucune photo recue.', 'NO_FILE');
  }
  const result = await eventService.addPhotos(req.event, req.files);
  res.status(201).json({ success: true, data: result });
});

export const removePhoto = asyncHandler(async (req, res) => {
  const result = await eventService.removePhoto(req.event, req.params.photoId);
  res.json({ success: true, data: result });
});

export const listRsvp = asyncHandler(async (req, res) => {
  const rsvps = await Rsvp.find({ eventId: req.event._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { rsvps, stats: req.event.stats } });
});

/** L'hote accepte ou refuse la presence d'un invite. */
export const respondRsvp = asyncHandler(async (req, res) => {
  const rsvp = await Rsvp.findOne({ _id: req.params.rsvpId, eventId: req.event._id });
  if (!rsvp) throw ApiError.notFound('Confirmation introuvable.');

  rsvp.hostResponse = req.body.hostResponse;
  rsvp.hostRespondedAt = new Date();
  await rsvp.save();

  // Notification au visiteur pour qu'il voie la reponse de l'hote.
  await notify({
    userId: rsvp.userId,
    type: 'rsvp',
    title:
      req.body.hostResponse === 'accepted'
        ? 'Votre presence est confirmee'
        : 'Votre presence est refusee',
    message: `${req.event.title} : l'organisateur a ${
      req.body.hostResponse === 'accepted' ? 'accepte' : 'refuse'
    } votre confirmation.`,
    link: `/e/${req.event.slug}`,
  });

  res.json({ success: true, data: { rsvp } });
});

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export const exportRsvp = asyncHandler(async (req, res) => {
  const entitlements = await getEventEntitlements(req.event);
  if (!entitlements.features.exportCsv) {
    throw ApiError.forbidden(
      "L'export CSV est réservé aux formules payantes. Passez au Premium pour exporter la liste des confirmations.",
      'PLAN_FEATURE_LOCKED',
    );
  }
  const rsvps = await Rsvp.find({ eventId: req.event._id }).sort({ createdAt: 1 });

  const header = ['Nom', 'Email', 'Telephone', 'Accompagnants', 'Reponse', 'Reponse hote', 'Message', 'Date'];
  const lines = [header.join(',')];
  for (const r of rsvps) {
    lines.push(
      [
        csvCell(r.name),
        csvCell(r.email),
        csvCell(r.phone),
        r.guestsCount,
        r.response,
        csvCell(r.hostResponse || ''),
        csvCell(r.message),
        r.createdAt.toISOString(),
      ].join(','),
    );
  }

  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="rsvp-${req.event.slug}.csv"`);
  res.send(lines.join('\n'));
});

export const listGuestbook = asyncHandler(async (req, res) => {
  const messages = await GuestbookMessage.find({ eventId: req.event._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, data: { messages } });
});

export const moderateGuestbook = asyncHandler(async (req, res) => {
  const message = await GuestbookMessage.findOne({
    _id: req.params.msgId,
    eventId: req.event._id,
  });
  if (!message) throw ApiError.notFound('Message introuvable.');

  message.status = req.body.status;
  await message.save();
  res.json({ success: true, data: { message } });
});

export const deleteGuestbookMessage = asyncHandler(async (req, res) => {
  const result = await GuestbookMessage.deleteOne({
    _id: req.params.msgId,
    eventId: req.event._id,
  });
  if (!result.deletedCount) throw ApiError.notFound('Message introuvable.');
  res.json({ success: true, data: { message: 'Message supprime.' } });
});

export const duplicateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.duplicateEvent(req.user.id, req.event);
  res.status(201).json({ success: true, data: { event } });
});

export const archiveEvent = asyncHandler(async (req, res) => {
  const event = await eventService.archiveEvent(req.event);
  res.json({ success: true, data: { event } });
});

export const unarchiveEvent = asyncHandler(async (req, res) => {
  const event = await eventService.unarchiveEvent(req.event);
  res.json({ success: true, data: { event } });
});
