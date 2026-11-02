import bcrypt from 'bcryptjs';
import { Event } from '../models/Event.js';
import { Rsvp } from '../models/Rsvp.js';
import { GuestbookMessage } from '../models/GuestbookMessage.js';
import { Template } from '../models/Template.js';
import { ApiError } from '../utils/ApiError.js';
import { generateUniqueEventSlug } from './slug.service.js';
import { processImage, processPoster } from './image.service.js';
import { uploadImage, deleteImage } from './storage.service.js';
import {
  countActiveEventPasses,
  getActiveEventLimit,
  getEventEntitlements,
  getUserEntitlements,
} from './plan.service.js';
import { EVENT_STATUS, EVENT_VISIBILITY } from '../config/constants.js';
import { PLAN_IDS } from '../config/plans.js';
import { CATEGORY_FIELDS } from '../config/categoryFields.js';

const ACTIVE_STATUSES = [
  EVENT_STATUS.DRAFT,
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.UNPUBLISHED,
];

async function loadEntitlements(ownerId, event = null) {
  return event
    ? getEventEntitlements(event)
    : getUserEntitlements(ownerId);
}

async function assertActiveEventQuota(ownerId, entitlements) {
  const [activeCount, activePasses] = await Promise.all([
    Event.countDocuments({
      ownerId,
      status: { $in: ACTIVE_STATUSES },
    }),
    entitlements.plan === PLAN_IDS.PRO ? 0 : countActiveEventPasses(ownerId),
  ]);
  const limit = getActiveEventLimit(entitlements, activePasses);

  if (limit !== null && activeCount >= limit) {
    throw ApiError.forbidden(
      `Limite de ${limit} événements actifs atteinte. Passez au Premium pour créer plus d'événements.`,
      'PLAN_LIMIT_EVENTS',
    );
  }
}

/** Compte la galerie principale et les galeries des champs de categorie. */
export function countEventPhotos(event) {
  const galleryCount = event.gallery?.length || 0;
  const fields = CATEGORY_FIELDS[event.category]?.fields || [];
  const details = event.details || {};

  const detailCount = fields.reduce((total, field) => {
    if (field.type !== 'gallery') return total;
    const photos = details[field.key];
    return total + (Array.isArray(photos) ? photos.length : 0);
  }, 0);

  return galleryCount + detailCount;
}

function assertPhotoQuota(event, entitlements) {
  const limit = entitlements.limits.maxPhotosPerEvent;
  if (limit === null) return;

  const total = countEventPhotos(event);
  if (total > limit) {
    throw ApiError.forbidden(
      `Limite de ${limit} photos par événement atteinte. Passez au Premium pour ajouter plus de photos.`,
      'PLAN_LIMIT_PHOTOS',
    );
  }
}

/**
 * Verifie qu'un template existe, correspond a la categorie et, s'il est
 * premium, que le proprietaire y a droit. `currentTemplateId` permet de
 * conserver un template premium deja utilise apres un downgrade.
 */
async function assertTemplateAllowed(templateId, category, entitlements, currentTemplateId = null) {
  if (!templateId) return;

  const template = await Template.findById(templateId);
  if (!template || !template.isActive) {
    throw ApiError.badRequest('Template introuvable ou inactif.', 'TEMPLATE_NOT_FOUND');
  }
  if (template.categorySlug !== category) {
    throw ApiError.badRequest(
      "Ce template ne correspond pas a la categorie de l'evenement.",
      'TEMPLATE_CATEGORY_MISMATCH',
    );
  }

  const unchanged = currentTemplateId && String(currentTemplateId) === String(templateId);
  if (template.isPremium && !entitlements.features.premiumTemplates && !unchanged) {
    throw ApiError.forbidden(
      'Ce template est reserve aux formules payantes.',
      'PREMIUM_REQUIRED',
    );
  }
}

export async function createEvent(ownerId, data) {
  const entitlements = await loadEntitlements(ownerId);
  await assertActiveEventQuota(ownerId, entitlements);
  await assertTemplateAllowed(data.templateId, data.category, entitlements);

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
  if (data.templateId) {
    const entitlements = await loadEntitlements(event.ownerId, event);
    await assertTemplateAllowed(
      data.templateId,
      data.category || event.category,
      entitlements,
      event.templateId,
    );
  }

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

export async function setMainImage(event, file) {
  if (!file) {
    throw ApiError.badRequest('Aucune affiche recue.', 'NO_FILE');
  }

  const previous = event.mainImage?.publicId;
  const processed = await processPoster(file.buffer);
  const image = await uploadImage(processed.buffer, {
    folder: `moncelebra/events/${event._id}/poster`,
    extension: processed.format,
  });

  event.set('mainImage', { url: image.url, publicId: image.publicId });
  await event.save();

  if (previous) await deleteImage(previous).catch(() => {});

  return event;
}

export async function removeMainImage(event) {
  const previous = event.mainImage?.publicId;

  event.set('mainImage', undefined);
  await event.save();

  if (previous) await deleteImage(previous).catch(() => {});

  return event;
}

export async function addPhotos(event, files) {
  const entitlements = await loadEntitlements(event.ownerId, event);
  const limit = entitlements.limits.maxPhotosPerEvent;
  const current = event.gallery?.length || 0;
  const remaining = limit === null ? files.length : limit - current;
  if (remaining <= 0) {
    throw ApiError.forbidden(
      `Limite de ${limit} photos par événement atteinte. Passez au Premium pour ajouter plus de photos.`,
      'PLAN_LIMIT_PHOTOS',
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
  const entitlements = await loadEntitlements(ownerId);
  await assertActiveEventQuota(ownerId, entitlements);
  await assertTemplateAllowed(event.templateId, event.category, entitlements);

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
