import bcrypt from 'bcryptjs';
import { Event } from '../models/Event.js';
import { Rsvp } from '../models/Rsvp.js';
import { GuestbookMessage } from '../models/GuestbookMessage.js';
import { ApiError } from '../utils/ApiError.js';
import { generateUniqueEventSlug } from './slug.service.js';
import { processImage } from './image.service.js';
import { uploadImage, deleteImage } from './storage.service.js';
import { QUOTAS, EVENT_STATUS, EVENT_VISIBILITY } from '../config/constants.js';
import { CATEGORY_FIELDS } from '../config/categoryFields.js';

const ACTIVE_STATUSES = [
  EVENT_STATUS.DRAFT,
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.UNPUBLISHED,
];

export async function createEvent(ownerId, data) {
  const activeCount = await Event.countDocuments({
    ownerId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (activeCount >= QUOTAS.MAX_ACTIVE_EVENTS) {
    throw ApiError.forbidden(
      `Limite de ${QUOTAS.MAX_ACTIVE_EVENTS} evenements actifs atteinte.`,
      'QUOTA_REACHED',
    );
  }

  const slug = await generateUniqueEventSlug(data.title);
  const categoryConfig = CATEGORY_FIELDS[data.category] || {};
  const defaults = categoryConfig.defaults || {};

  const visibility = data.visibility || defaults.visibility || EVENT_VISIBILITY.PUBLIC;

  const { accessCode, ...rest } = data;
  const doc = { ...rest, ownerId, slug, visibility };

  if (defaults.countdownEnabled !== undefined) {
    doc.settings = {
      ...(data.settings || {}),
      countdownEnabled: data.settings?.countdownEnabled ?? defaults.countdownEnabled,
    };
  }

  if (visibility === EVENT_VISIBILITY.PASSWORD) {
    if (!accessCode) {
      throw ApiError.badRequest(
        "Un code d'acces est requis pour un evenement protege.",
        'ACCESS_CODE_REQUIRED',
      );
    }
    doc.accessCodeHash = await bcrypt.hash(accessCode, 10);
  }

  return Event.create(doc);
}

export async function updateEvent(event, data) {
  const { accessCode, ...rest } = data;
  Object.assign(event, rest);

  if (event.visibility === EVENT_VISIBILITY.PASSWORD) {
    if (accessCode) event.accessCodeHash = await bcrypt.hash(accessCode, 10);
    else if (!event.accessCodeHash) {
      throw ApiError.badRequest(
        "Un code d'acces est requis pour un evenement protege.",
        'ACCESS_CODE_REQUIRED',
      );
    }
  } else if (accessCode === undefined) {
    event.accessCodeHash = null;
  }

  await event.save();
  return event;
}

export async function publishEvent(event) {
  event.status = EVENT_STATUS.PUBLISHED;
  event.publishedAt = new Date();
  await event.save();
  return event;
}

export async function unpublishEvent(event) {
  event.status = EVENT_STATUS.UNPUBLISHED;
  await event.save();
  return event;
}

export async function deleteEvent(event) {
  const publicIds = [
    event.mainImage?.publicId,
    event.design?.coverImage?.publicId,
    ...(event.gallery || []).map((photo) => photo.publicId),
  ].filter(Boolean);

  await Promise.allSettled(publicIds.map((id) => deleteImage(id)));

  await Promise.all([
    Rsvp.deleteMany({ eventId: event._id }),
    GuestbookMessage.deleteMany({ eventId: event._id }),
  ]);

  await event.deleteOne();
}

export async function addPhotos(event, files) {
  const current = event.gallery?.length || 0;
  const remaining = QUOTAS.MAX_GALLERY_PHOTOS - current;
  if (remaining <= 0) {
    throw ApiError.badRequest(
      `Limite de ${QUOTAS.MAX_GALLERY_PHOTOS} photos atteinte.`,
      'GALLERY_FULL',
    );
  }

  const accepted = files.slice(0, remaining);
  const startOrder = current;

  const stored = await Promise.all(
    accepted.map(async (file, index) => {
      const processed = await processImage(file.buffer);
      const image = await uploadImage(processed.buffer, {
        folder: `moncelebra/events/${event._id}`,
        extension: processed.format,
      });
      return { url: image.url, publicId: image.publicId, order: startOrder + index };
    }),
  );

  event.gallery.push(...stored);
  await event.save();
  return { added: stored.length, total: event.gallery.length };
}

export async function removePhoto(event, photoId) {
  const photo = event.gallery.id(photoId);
  if (!photo) throw ApiError.notFound('Photo introuvable.');

  if (photo.publicId) {
    await deleteImage(photo.publicId).catch(() => {});
  }

  event.gallery.pull(photoId);
  await event.save();
  return { total: event.gallery.length };
}

export async function duplicateEvent(ownerId, event) {
  const activeCount = await Event.countDocuments({
    ownerId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (activeCount >= QUOTAS.MAX_ACTIVE_EVENTS) {
    throw ApiError.forbidden(
      `Limite de ${QUOTAS.MAX_ACTIVE_EVENTS} evenements actifs atteinte.`,
      'QUOTA_REACHED',
    );
  }

  const baseTitle = event.title || 'Evenement duplique';
  const title = `${baseTitle} (copie)`;
  const slug = await generateUniqueEventSlug(title);

  const copy = await Event.create({
    ownerId,
    category: event.category,
    slug,
    title,
    tagline: event.tagline,
    description: event.description,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    timezone: event.timezone,
    location: event.location ? JSON.parse(JSON.stringify(event.location)) : undefined,
    locations: event.locations ? JSON.parse(JSON.stringify(event.locations)) : [],
    templateId: event.templateId,
    design: event.design ? JSON.parse(JSON.stringify(event.design)) : {},
    program: event.program ? JSON.parse(JSON.stringify(event.program)) : [],
    details: event.details ? JSON.parse(JSON.stringify(event.details)) : {},
    visibility: event.visibility,
    settings: event.settings ? JSON.parse(JSON.stringify(event.settings)) : {},
    status: EVENT_STATUS.DRAFT,
  });

  return copy;
}

export async function archiveEvent(event) {
  event.status = EVENT_STATUS.ARCHIVED;
  await event.save();
  return event;
}

export async function unarchiveEvent(event) {
  event.status = EVENT_STATUS.DRAFT;
  await event.save();
  return event;
}
