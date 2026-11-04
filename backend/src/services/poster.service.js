import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import {
  computeQrLayout,
  normalizeQrSettings,
  resolveQrPlacement,
} from '../config/poster.js';
import { processPoster } from './image.service.js';
import {
  deleteImage,
  fetchImageBytes,
  uploadImage,
} from './storage.service.js';

const MAX_COMPOSED_BYTES = 5 * 1024 * 1024;
const HARD_MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MIN_POSTER_WIDTH = 800;
const ALLOWED_POSTER_FORMATS = ['jpeg', 'png', 'webp'];
const QR_ERROR_CORRECTION = 'H';
const CAPTION_FONT =
  'DejaVu Sans, Arial, Helvetica, "Segoe UI", Roboto, sans-serif';

export const POSTER_CAPTIONS = Object.freeze({
  fr: 'Pour en savoir plus et découvrir toutes les informations, scannez le QR code.',
  en: 'To learn more and discover all the information, scan the QR code.',
  wo: 'Ngir xam lu ëpp ak gis xibaar yi lépp, skane kodu QR bi.',
});

export function getPosterCaption(language) {
  return POSTER_CAPTIONS[language] || POSTER_CAPTIONS.fr;
}

export function buildPosterQrUrl(event) {
  return `${env.clientUrl}/e/${event.slug}`;
}

function readPosterDimensions(metadata) {
  let width = metadata.width;
  let height = metadata.height;
  if ([5, 6, 7, 8].includes(metadata.orientation)) {
    [width, height] = [height, width];
  }
  return { width, height };
}

/**
 * Verifie le fichier reel (et non le mimetype declare par le client) avant
 * tout traitement couteux : format, poids et largeur minimale.
 */
export async function validatePosterSource(buffer, { maxBytes = HARD_MAX_SOURCE_BYTES } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw ApiError.badRequest('Aucun fichier recu.', 'NO_FILE');
  }
  if (buffer.length > Math.min(maxBytes, HARD_MAX_SOURCE_BYTES)) {
    throw ApiError.badRequest(
      `L'affiche depasse la taille maximale autorisee (${Math.round(Math.min(maxBytes, HARD_MAX_SOURCE_BYTES) / 1024 / 1024)} Mo).`,
      'FILE_TOO_LARGE',
    );
  }
  if (buffer.subarray(0, 5).toString() === '%PDF-') {
    throw ApiError.badRequest(
      "Le format PDF n'est pas encore pris en charge. Exportez la premiere page en JPEG ou PNG.",
      'PDF_UNSUPPORTED',
    );
  }

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw ApiError.badRequest(
      "Ce fichier n'est pas une image valide. Formats acceptes : JPEG, PNG, WebP.",
      'INVALID_FILE_TYPE',
    );
  }

  if (!ALLOWED_POSTER_FORMATS.includes(metadata.format)) {
    throw ApiError.badRequest(
      "Format d'image non autorise. Formats acceptes : JPEG, PNG, WebP.",
      'INVALID_FILE_TYPE',
    );
  }

  const { width, height } = readPosterDimensions(metadata);
  if (!width || !height) {
    throw ApiError.badRequest("Ce fichier n'est pas une image valide.", 'INVALID_POSTER');
  }
  if (width < MIN_POSTER_WIDTH) {
    throw ApiError.badRequest(
      `L'affiche est trop petite (${width} px de large). La largeur minimale est de ${MIN_POSTER_WIDTH} px.`,
      'POSTER_TOO_SMALL',
    );
  }

  return { width, height, format: metadata.format };
}

/**
 * Decode le QR present sur l'image composee pour signaler un eventuel
 * probleme de lisibilite (contraste, taille, recouvrement...).
 */
export async function inspectPosterQr(buffer, expectedUrl) {
  try {
    const { data, info } = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    const decodedUrl = result?.data || null;
    return {
      qrReadable: Boolean(decodedUrl && decodedUrl === expectedUrl),
      decodedUrl,
    };
  } catch {
    return { qrReadable: false, decodedUrl: null };
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildOverlaySvg(layout) {
  const {
    width,
    height,
    cardX,
    cardY,
    cardWidth,
    cardHeight,
    radius,
    pad,
    fontSize,
    lineHeight,
    lines,
    textGap,
    qrSize,
  } = layout;

  const shadowOffset = Math.max(2, Math.round(qrSize * 0.04));
  const textStart = cardY + pad + qrSize + textGap;
  const centerX = cardX + cardWidth / 2;
  const textNodes = lines
    .map((line, index) => {
      const y = textStart + index * lineHeight + Math.round(fontSize * 0.82);
      return `<text x="${centerX}" y="${y}" text-anchor="middle" font-family='${CAPTION_FONT}' font-size="${fontSize}" font-weight="600" fill="#111111">${escapeXml(line)}</text>`;
    })
    .join('');

  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${cardX + shadowOffset}" y="${cardY + shadowOffset}" width="${cardWidth}" height="${cardHeight}" rx="${radius}" fill="rgba(0,0,0,0.35)" />
      <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${radius}" fill="#FFFFFF" />
      ${textNodes}
    </svg>`,
  );
}

export async function composePosterBuffer({
  sourceBuffer,
  qrUrl,
  qr,
  caption,
}) {
  if (!sourceBuffer || !Buffer.isBuffer(sourceBuffer)) {
    throw ApiError.badRequest("Affiche source introuvable.", 'NO_POSTER_SOURCE');
  }
  if (!qrUrl) {
    throw ApiError.badRequest("Lien du QR code manquant.", 'NO_QR_URL');
  }

  const metadata = await sharp(sourceBuffer).metadata();
  let width = metadata.width;
  let height = metadata.height;
  if ([5, 6, 7, 8].includes(metadata.orientation)) {
    [width, height] = [height, width];
  }
  if (!width || !height) {
    throw ApiError.badRequest("Affiche invalide.", 'INVALID_POSTER');
  }

  const settings = resolveQrPlacement({
    qr,
    width,
    height,
    caption: caption || '',
  });
  const layout = computeQrLayout({
    qr: settings,
    width,
    height,
    caption: caption || '',
  });

  const qrPng = await QRCode.toBuffer(qrUrl, {
    type: 'png',
    width: Math.max(600, layout.qrSize * 2),
    margin: 1,
    errorCorrectionLevel: QR_ERROR_CORRECTION,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  const qrBuffer = await sharp(qrPng)
    .resize(layout.qrSize, layout.qrSize, { fit: 'fill' })
    .png()
    .toBuffer();

  const overlay = buildOverlaySvg(layout);
  const canvas = sharp(sourceBuffer)
    .rotate()
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: qrBuffer, top: layout.qrY, left: layout.qrX },
    ])
    .png();

  let buffer = await canvas.toBuffer();
  let format = 'png';

  if (buffer.length > MAX_COMPOSED_BYTES) {
    buffer = await sharp(buffer)
      .flatten({ background: '#FFFFFF' })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    format = 'jpeg';
  }

  return {
    buffer,
    format,
    width,
    height,
    bytes: buffer.length,
    qr: {
      ...settings,
      size: layout.qrSize / width,
      x: layout.qrX / width,
      y: layout.qrY / height,
    },
  };
}

export async function storePosterSource(event, buffer) {
  const processed = await processPoster(buffer);
  const stored = await uploadImage(processed.buffer, {
    folder: `moncelebra/events/${event._id}/poster/source`,
    extension: processed.format,
  });

  return {
    ...stored,
    width: processed.width,
    height: processed.height,
    format: processed.format,
    bytes: processed.bytes,
  };
}

async function resolveSourceBytes(event, sourceBuffer) {
  if (sourceBuffer) return sourceBuffer;
  if (event.poster?.sourceUrl) {
    return fetchImageBytes({
      url: event.poster.sourceUrl,
      publicId: event.poster.sourcePublicId,
    });
  }
  if (event.mainImage?.url) {
    return fetchImageBytes(event.mainImage);
  }
  throw ApiError.badRequest("Aucune affiche source pour cet evenement.", 'NO_POSTER_SOURCE');
}

function posterValue(event) {
  return event.poster || {};
}

export async function composeAndStorePoster(
  event,
  { sourceBuffer, qr, mode, templateId, caption } = {},
) {
  const source = await resolveSourceBytes(event, sourceBuffer);
  const current = posterValue(event);
  const currentQr = current.qr?.toObject ? current.qr.toObject() : current.qr;
  const nextQr = { ...(currentQr || {}), ...(qr || {}) };
  if (
    qr?.position &&
    qr.position !== 'custom' &&
    !Number.isFinite(Number(qr.x)) &&
    !Number.isFinite(Number(qr.y))
  ) {
    delete nextQr.x;
    delete nextQr.y;
  }

  const composed = await composePosterBuffer({
    sourceBuffer: source,
    qrUrl: buildPosterQrUrl(event),
    qr: nextQr,
    caption: caption ?? getPosterCaption(event.language),
  });

  const stored = await uploadImage(composed.buffer, {
    folder: `moncelebra/events/${event._id}/poster/composed`,
    extension: composed.format,
  });
  const previous = current.composedPublicId;

  event.poster = {
    ...current,
    mode: mode || current.mode || 'upload',
    composedUrl: stored.url,
    composedPublicId: stored.publicId,
    qr: composed.qr,
    templateId: templateId === undefined ? current.templateId : templateId,
    updatedAt: new Date(),
  };
  await event.save();

  if (previous && previous !== stored.publicId) {
    await deleteImage(previous).catch(() => {});
  }

  return event;
}

export async function importEventPoster(
  event,
  file,
  { qr, mode = 'upload', maxBytes, caption } = {},
) {
  if (!file?.buffer) {
    throw ApiError.badRequest('Aucun fichier recu.', 'NO_FILE');
  }

  await validatePosterSource(file.buffer, { maxBytes });

  const previousSource = event.poster?.sourcePublicId || event.mainImage?.publicId;
  const previousComposed = event.poster?.composedPublicId;
  const source = await storePosterSource(event, file.buffer);

  event.set('mainImage', { url: source.url, publicId: source.publicId });
  event.poster = {
    ...(event.poster?.toObject ? event.poster.toObject() : event.poster || {}),
    mode,
    sourceUrl: source.url,
    sourcePublicId: source.publicId,
    qr: normalizeQrSettings(qr || {}),
    templateId: null,
    updatedAt: new Date(),
  };
  await event.save();

  const result = await composeAndStorePoster(event, {
    sourceBuffer: source.buffer,
    caption,
  });

  const stale = [previousSource, previousComposed].filter(
    (id) =>
      id &&
      id !== source.publicId &&
      id !== event.poster?.composedPublicId,
  );
  await Promise.allSettled([...new Set(stale)].map((id) => deleteImage(id)));

  const readability = await inspectPosterQr(
    await fetchImageBytes({
      url: event.poster.composedUrl,
      publicId: event.poster.composedPublicId,
    }),
    buildPosterQrUrl(event),
  );

  return { event, ...readability };
}

export async function updateEventPosterSettings(
  event,
  { qr, mode, templateId, caption } = {},
) {
  if (!event.poster?.sourceUrl && !event.mainImage?.url) {
    throw ApiError.badRequest("Aucune affiche a modifier.", 'NO_POSTER');
  }

  if (!event.poster?.sourceUrl && event.mainImage?.url) {
    event.poster = {
      ...(event.poster?.toObject ? event.poster.toObject() : event.poster || {}),
      mode: 'upload',
      sourceUrl: event.mainImage.url,
      sourcePublicId: event.mainImage.publicId,
      updatedAt: new Date(),
    };
  }

  const result = await composeAndStorePoster(event, {
    qr,
    mode,
    templateId,
    caption,
  });

  const readability = await inspectPosterQr(
    await fetchImageBytes({
      url: result.poster.composedUrl,
      publicId: result.poster.composedPublicId,
    }),
    buildPosterQrUrl(event),
  );

  return { event: result, ...readability };
}

export async function removeEventPoster(event) {
  const ids = [
    event.poster?.sourcePublicId,
    event.poster?.composedPublicId,
    event.mainImage?.publicId,
  ].filter(Boolean);

  event.set('poster', undefined);
  event.set('mainImage', undefined);
  await event.save();

  await Promise.allSettled([...new Set(ids)].map((id) => deleteImage(id)));
  return event;
}

export async function regenerateEventPoster(event) {
  if (!event.poster?.sourceUrl) return null;
  return composeAndStorePoster(event, {
    mode: event.poster.mode,
    templateId: event.poster.templateId,
  });
}

export async function deletePosterAssets(event) {
  const ids = [
    event.poster?.sourcePublicId,
    event.poster?.composedPublicId,
  ].filter(Boolean);

  await Promise.allSettled(ids.map((id) => deleteImage(id)));
}
