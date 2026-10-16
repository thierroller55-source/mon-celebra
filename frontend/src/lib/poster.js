import QRCode from 'qrcode';

/**
 * Compose l'affiche de l'evenement avec le QR code incruste (canvas navigateur).
 * Utilitaire unique reutilise par le tableau de bord, l'apercu et la publication.
 */

export const POSTER_CAPTION =
  'Pour en savoir plus et decouvrir toutes les informations, scannez le QR code.';

const PUBLIC_BASE = (
  import.meta.env.VITE_PUBLIC_URL || 'https://mon-celebra.vercel.app'
).replace(/\/+$/, '');

/** URL publique encodee dans le QR code (jamais localhost). */
export function publicEventUrl(slug) {
  return `${PUBLIC_BASE}/e/${slug}`;
}

/** Nom du fichier telecharge. */
export function posterFileName(slug) {
  return `affiche-${slug}.png`;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (typeof source === 'string' && !/^(blob:|data:)/.test(source)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger l'image de l'affiche."));
    img.src = source;
  });
}

async function resolveSource(source) {
  if (source instanceof Blob) {
    const url = URL.createObjectURL(source);
    try {
      return await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return loadImage(source);
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Genere un Blob PNG : affiche + QR code incruste + mention.
 *
 * @param {object} params
 * @param {Blob|string} params.posterUrl  Affiche (Blob recommande, ou URL/objet URL).
 * @param {string} params.qrUrl           URL publique encodee dans le QR code.
 * @param {'bottom-right'|'bottom-left'|'bottom-center'} [params.position]
 * @param {string} [params.caption]       Mention sous le QR code.
 * @returns {Promise<Blob>}
 */
export async function composePosterWithQr({
  posterUrl,
  qrUrl,
  position = 'bottom-right',
  caption = POSTER_CAPTION,
}) {
  const poster = await resolveSource(posterUrl);

  const w0 = poster.naturalWidth || poster.width;
  const h0 = poster.naturalHeight || poster.height;
  if (!w0 || !h0) throw new Error("Affiche invalide.");

  const maxDimension = 4096;
  const scale = Math.min(1, maxDimension / Math.max(w0, h0));
  const width = Math.round(w0 * scale);
  const height = Math.round(h0 * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(poster, 0, 0, width, height);

  const qrSize = Math.max(Math.round(width * 0.2), 160);
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: Math.max(600, qrSize * 2),
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  const qrImage = await loadImage(qrDataUrl);

  const pad = Math.round(qrSize * 0.09);
  const radius = Math.round(qrSize * 0.14);
  const margin = Math.round(width * 0.03);
  const fontSize = Math.max(Math.round(qrSize * 0.095), 14);
  const font = `600 ${fontSize}px ${FONT_FAMILY}`;

  ctx.font = font;
  const lines = wrapLines(ctx, caption, qrSize);
  const lineHeight = Math.round(fontSize * 1.3);
  const textHeight = lines.length * lineHeight;

  const cardW = qrSize + pad * 2;
  const cardH = pad * 2 + qrSize + Math.round(pad * 0.6) + textHeight;

  let cardX;
  if (position === 'bottom-left') cardX = margin;
  else if (position === 'bottom-center') cardX = Math.round((width - cardW) / 2);
  else cardX = width - cardW - margin;

  const cardY = height - cardH - margin;
  cardX = Math.max(margin, Math.min(cardX, width - cardW - margin));
  const y = Math.max(margin, cardY);

  // Cadre blanc arrondi + legere ombre
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = Math.round(qrSize * 0.14);
  ctx.shadowOffsetY = Math.round(qrSize * 0.04);
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, cardX, y, cardW, cardH, radius);
  ctx.fill();
  ctx.restore();

  // QR code (noir sur blanc, zone de silence preservee)
  ctx.drawImage(qrImage, cardX + pad, y + pad, qrSize, qrSize);

  // Mention sous le QR code
  ctx.fillStyle = '#111111';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let textY = y + pad + qrSize + Math.round(pad * 0.6);
  for (const line of lines) {
    ctx.fillText(line, cardX + cardW / 2, textY);
    textY += lineHeight;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Echec de la generation de l'image."))),
      'image/png',
    );
  });
}

/** Declenche le telechargement d'un Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Partage natif (WhatsApp, etc.) si disponible. Retourne false si non supporte.
 */
export async function shareBlob(blob, filename, title = '') {
  try {
    if (!navigator.share || !navigator.canShare) return false;
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    if (!navigator.canShare({ files: [file] })) return false;
    await navigator.share({ files: [file], title });
    return true;
  } catch (err) {
    return err?.name === 'AbortError';
  }
}
