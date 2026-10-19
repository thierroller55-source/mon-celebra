import bcrypt from 'bcryptjs';
import { Event } from '../models/Event.js';
import { Rsvp } from '../models/Rsvp.js';
import { GuestbookMessage } from '../models/GuestbookMessage.js';
import { Report } from '../models/Report.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashIp } from '../utils/ipHash.js';
import { processImage } from '../services/image.service.js';
import { uploadImage } from '../services/storage.service.js';
import { notify } from '../services/notification.service.js';
import { buildEventIcs } from '../services/calendar.service.js';
import { env } from '../config/env.js';
import {
  EVENT_STATUS,
  EVENT_VISIBILITY,
  GUESTBOOK_STATUS,
  RSVP_RESPONSE,
} from '../config/constants.js';

function findPublishedEvent(slug, { withAccessCode = false } = {}) {
  const query = Event.findOne({ slug, status: EVENT_STATUS.PUBLISHED });
  if (withAccessCode) query.select('+accessCodeHash');
  return query;
}

/** Page publique d'un evenement + livre d'or approuve. */
export const getPublicEvent = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const code = req.query.code ? String(req.query.code) : '';

  const event = await Event.findOne({ slug }).select('+accessCodeHash').populate('templateId');

  if (!event) {
    throw ApiError.notFound('Evenement introuvable.', 'EVENT_NOT_FOUND');
  }

  if (event.status !== EVENT_STATUS.PUBLISHED) {
    throw ApiError.notFound(
      "Cet evenement n'est pas encore publie.",
      'EVENT_NOT_PUBLISHED',
    );
  }

  if (event.visibility === EVENT_VISIBILITY.PASSWORD) {
    const valid = event.accessCodeHash ? await bcrypt.compare(code, event.accessCodeHash) : false;
    if (!valid) {
      throw ApiError.forbidden('Cet evenement est protege par un code.', 'ACCESS_CODE_REQUIRED');
    }
  }

  await Event.updateOne({ _id: event._id }, { $inc: { 'stats.views': 1 } });

  const guestbook =
    event.settings?.guestbookEnabled === false
      ? []
      : await GuestbookMessage.find({
          eventId: event._id,
          status: GUESTBOOK_STATUS.APPROVED,
        })
          .sort({ createdAt: -1 })
          .limit(100);

  const data = event.toObject();
  delete data.accessCodeHash;
  data.stats = { ...data.stats, views: (data.stats?.views ?? 0) + 1 };
  data.guestbook = guestbook;

  res.json({ success: true, data: { event: data } });
});

/** RSVP d'un invite. */
export const createRsvp = asyncHandler(async (req, res) => {
  const event = await findPublishedEvent(req.params.slug);
  if (!event) throw ApiError.notFound('Evenement introuvable.');
  if (event.settings?.rsvpEnabled === false) {
    throw ApiError.forbidden('Les confirmations sont fermees pour cet evenement.', 'RSVP_DISABLED');
  }

  const rsvp = await Rsvp.create({ ...req.body, eventId: event._id, ipHash: hashIp(req.ip) });

  const increment =
    rsvp.response === RSVP_RESPONSE.YES
      ? { 'stats.rsvpYes': 1 }
      : rsvp.response === RSVP_RESPONSE.NO
        ? { 'stats.rsvpNo': 1 }
        : { 'stats.rsvpMaybe': 1 };
  await Event.updateOne({ _id: event._id }, { $inc: increment });

  await notify({
    userId: event.ownerId,
    type: 'rsvp',
    title: 'Nouvelle confirmation RSVP',
    message: `${rsvp.name} a repondu "${rsvp.response}" pour ${event.title}.`,
    link: `/dashboard/evenements/${event._id}`,
  });

  res.status(201).json({ success: true, data: { rsvp } });
});

/** Message du livre d'or. */
export const createGuestbookMessage = asyncHandler(async (req, res) => {
  const event = await findPublishedEvent(req.params.slug);
  if (!event) throw ApiError.notFound('Evenement introuvable.');
  if (event.settings?.guestbookEnabled === false) {
    throw ApiError.forbidden('Le livre d\'or est ferme pour cet evenement.', 'GUESTBOOK_DISABLED');
  }

  let photo;
  if (req.file) {
    const processed = await processImage(req.file.buffer);
    photo = await uploadImage(processed.buffer, {
      folder: `moncelebra/events/${event._id}/guestbook`,
      extension: processed.format,
    });
  }

  const status =
    event.settings?.guestbookModeration === false
      ? GUESTBOOK_STATUS.APPROVED
      : GUESTBOOK_STATUS.PENDING;

  const message = await GuestbookMessage.create({
    eventId: event._id,
    authorName: req.body.authorName,
    message: req.body.message,
    photo: photo ? { url: photo.url, publicId: photo.publicId } : undefined,
    status,
    ipHash: hashIp(req.ip),
  });

  await notify({
    userId: event.ownerId,
    type: 'guestbook',
    title: 'Nouveau message dans le livre d\'or',
    message: `${message.authorName} a laisse un message pour ${event.title}.`,
    link: `/dashboard/evenements/${event._id}`,
  });

  res.status(201).json({ success: true, data: { message } });
});

/** Signalement d'un evenement. */
export const createReport = asyncHandler(async (req, res) => {
  const { eventId, reporterEmail, reason } = req.body;

  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Evenement introuvable.');

  await Report.create({ eventId, reporterEmail, reason });
  res.status(201).json({
    success: true,
    data: { message: 'Merci, votre signalement a bien ete pris en compte.' },
  });
});

/** Export iCalendar (.ics) pour l'agenda de l'invite. */
export const getEventCalendar = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const event = await findPublishedEvent(slug, { withAccessCode: true });

  if (!event) {
    throw ApiError.notFound('Evenement introuvable.');
  }

  if (event.visibility === EVENT_VISIBILITY.PASSWORD) {
    const code = req.query.code ? String(req.query.code) : '';
    const valid = event.accessCodeHash ? await bcrypt.compare(code, event.accessCodeHash) : false;
    if (!valid) {
      throw ApiError.forbidden('Cet evenement est protege par un code.', 'ACCESS_CODE_REQUIRED');
    }
  }

  const url = `${env.clientUrl}/e/${event.slug}`;
  const ics = buildEventIcs(event, url);

  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="${event.slug}.ics"`);
  res.send(ics);
});
