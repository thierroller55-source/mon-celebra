export const POSTER_MODES = Object.freeze(['upload', 'template', 'canva_import'] as const);
export type PosterMode = (typeof POSTER_MODES)[number];

export const QR_POSITIONS = Object.freeze([
  'bottom-right',
  'bottom-left',
  'bottom-center',
  'top-right',
  'custom',
] as const);
export type QrPosition = (typeof QR_POSITIONS)[number];

export const QR_MIN_SIZE = 0.15;
export const QR_DEFAULT_SIZE = 0.2;
export const QR_DEFAULT_POSITION: QrPosition = 'bottom-right';

export interface QrSettings {
  x: number;
  y: number;
  size: number;
  position: QrPosition;
  captionVisible: boolean;
}

interface QrInput {
  x?: number | string | null;
  y?: number | string | null;
  size?: number | string | null;
  position?: string | null;
  captionVisible?: boolean | null;
}

interface QrLayoutParams {
  qr: QrInput;
  width: number;
  height: number;
  caption?: string;
}

interface QrPresetParams {
  position?: string | null;
  size?: number | string | null;
  width: number;
  height: number;
  caption?: string;
  captionVisible?: boolean;
}

export function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function roundRelative(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function hasExplicitPlacement(input: QrInput = {}) {
  const x = Number(input.x);
  const y = Number(input.y);
  return (
    input.x !== null &&
    input.x !== undefined &&
    input.x !== '' &&
    input.y !== null &&
    input.y !== undefined &&
    input.y !== '' &&
    Number.isFinite(x) &&
    Number.isFinite(y)
  );
}

export function normalizeQrSettings(input: QrInput = {}): QrSettings {
  const rawSize = Number(input.size);
  const size = clampNumber(
    Number.isFinite(rawSize) && rawSize > 0 ? rawSize : QR_DEFAULT_SIZE,
    QR_MIN_SIZE,
    1,
  );
  const position = QR_POSITIONS.includes(input.position as QrPosition)
    ? (input.position as QrPosition)
    : QR_DEFAULT_POSITION;
  const captionVisible = input.captionVisible !== false;

  const maxX = Math.max(0, 1 - size);
  const maxY = Math.max(0, 1 - size);
  const rawX = Number(input.x);
  const rawY = Number(input.y);
  const x = clampNumber(Number.isFinite(rawX) ? rawX : 0, 0, maxX);
  const y = clampNumber(Number.isFinite(rawY) ? rawY : 0, 0, maxY);

  return {
    x: roundRelative(x),
    y: roundRelative(y),
    size: roundRelative(size),
    position,
    captionVisible,
  };
}

export function wrapCaption(caption: string, maxWidth: number, fontSize: number) {
  const text = String(caption || '').trim();
  if (!text) return [];

  const avgCharWidth = Math.max(1, fontSize * 0.55);
  const maxChars = Math.max(8, Math.floor(maxWidth / avgCharWidth));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildMetrics(qrSize: number, caption: string, captionVisible: boolean) {
  const pad = Math.round(qrSize * 0.09);
  const radius = Math.round(qrSize * 0.14);
  const fontSize = Math.max(Math.round(qrSize * 0.095), 14);
  const lineHeight = Math.round(fontSize * 1.3);
  const lines = captionVisible ? wrapCaption(caption, qrSize, fontSize) : [];
  const textHeight = lines.length * lineHeight;
  const textGap = captionVisible ? Math.round(pad * 0.6) : 0;
  const cardWidth = qrSize + pad * 2;
  const cardHeight = pad * 2 + qrSize + textGap + textHeight;

  return {
    pad,
    radius,
    fontSize,
    lineHeight,
    lines,
    textHeight,
    textGap,
    cardWidth,
    cardHeight,
  };
}

export function computeQrLayout({ qr, width, height, caption = '' }: QrLayoutParams) {
  const settings = normalizeQrSettings(qr);
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const margin = Math.max(1, Math.round(safeWidth * 0.03));
  const minQrSize = Math.max(1, Math.ceil(safeWidth * QR_MIN_SIZE));
  const maxQrWidth = Math.max(1, safeWidth - margin * 2);
  const maxQrHeight = Math.max(1, safeHeight - margin * 2);

  let qrSize = Math.round(settings.size * safeWidth);
  qrSize = clampNumber(qrSize, minQrSize, safeWidth);
  let metrics = buildMetrics(qrSize, caption, settings.captionVisible);

  if (metrics.cardWidth > maxQrWidth || metrics.cardHeight > maxQrHeight) {
    const ratio = Math.min(
      maxQrWidth / metrics.cardWidth,
      maxQrHeight / metrics.cardHeight,
    );
    qrSize = Math.max(minQrSize, Math.min(safeWidth, Math.floor(qrSize * ratio)));
    metrics = buildMetrics(qrSize, caption, settings.captionVisible);
  }

  const maxCardX = Math.max(margin, safeWidth - metrics.cardWidth - margin);
  const maxCardY = Math.max(margin, safeHeight - metrics.cardHeight - margin);
  const desiredCardX = Math.round(settings.x * safeWidth) - metrics.pad;
  const desiredCardY = Math.round(settings.y * safeHeight) - metrics.pad;
  const cardX = clampNumber(desiredCardX, margin, maxCardX);
  const cardY = clampNumber(desiredCardY, margin, maxCardY);

  return {
    ...metrics,
    margin,
    qrSize,
    qrX: cardX + metrics.pad,
    qrY: cardY + metrics.pad,
    cardX,
    cardY,
    settings,
    width: safeWidth,
    height: safeHeight,
  };
}

export function resolveQrPreset({
  position = QR_DEFAULT_POSITION,
  size = QR_DEFAULT_SIZE,
  width,
  height,
  caption = '',
  captionVisible = true,
}: QrPresetParams): QrSettings {
  const base = normalizeQrSettings({ position, size, captionVisible });

  if (base.position === 'custom' || !width || !height) return base;

  const probe = computeQrLayout({
    qr: { ...base, x: 0, y: 0 },
    width,
    height,
    caption,
  });
  const right = base.position === 'bottom-right' || base.position === 'top-right';
  const bottom = base.position !== 'top-right';

  const maxCardX = Math.max(probe.margin, probe.width - probe.cardWidth - probe.margin);
  const maxCardY = Math.max(probe.margin, probe.height - probe.cardHeight - probe.margin);
  const cardX = right
    ? maxCardX
    : base.position === 'bottom-center'
      ? Math.round((probe.width - probe.cardWidth) / 2)
      : probe.margin;
  const cardY = bottom ? maxCardY : probe.margin;

  return normalizeQrSettings({
    ...base,
    size: probe.qrSize / probe.width,
    x: (cardX + probe.pad) / probe.width,
    y: (cardY + probe.pad) / probe.height,
  });
}

export function resolveQrPlacement({
  qr,
  width,
  height,
  caption = '',
}: QrLayoutParams): QrSettings {
  const input = qr || {};
  const position = QR_POSITIONS.includes(input.position as QrPosition)
    ? (input.position as QrPosition)
    : QR_DEFAULT_POSITION;

  if (position !== 'custom' && !hasExplicitPlacement(input)) {
    return resolveQrPreset({
      position,
      size: input.size,
      width,
      height,
      caption,
      captionVisible: input.captionVisible !== false,
    });
  }

  return normalizeQrSettings(input);
}
