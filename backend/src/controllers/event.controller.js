import { Event } from '../models/Event.js';
import { Rsvp } from '../models/Rsvp.js';
import { GuestbookMessage } from '../models/GuestbookMessage.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as eventService from '../services/event.service.js';
import { fetchImageBytes } from '../services/storage.service.js';

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

/** Restitue les octets de l'affiche via l'API (same-origin, sans CORS). */
export const getEventPoster = asyncHandler(async (req, res) => {
  const image = req.event.mainImage;
  if (!image?.url) {
    throw ApiError.notFound("Aucune affiche pour cet evenement.", 'NO_POSTER');
  }

  const buffer = await fetchImageBytes(image);
  const ext = (image.publicId || image.url).split('.').pop().toLowerCase();

  res.set('Content-Type', POSTER_MIME[ext] || 'application/octet-stream');
  res.set('Cache-Control', 'private, max-age=300');
  res.send(buffer);
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

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export const exportRsvp = asyncHandler(async (req, res) => {
  const rsvps = await Rsvp.find({ eventId: req.event._id }).sort({ createdAt: 1 });

  const header = ['Nom', 'Telephone', 'Accompagnants', 'Reponse', 'Message', 'Date'];
  const lines = [header.join(',')];
  for (const r of rsvps) {
    lines.push(
      [
        csvCell(r.name),
        csvCell(r.phone),
        r.guestsCount,
        r.response,
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
