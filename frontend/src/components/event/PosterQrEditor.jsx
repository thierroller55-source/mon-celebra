import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  QR_DEFAULT_SIZE,
  QR_MIN_SIZE,
  hasExplicitPlacement,
  resolveQrPreset,
} from '../../lib/posterGeometry.js';

const PRESETS = [
  { value: 'bottom-right', key: 'poster.positionRight' },
  { value: 'bottom-left', key: 'poster.positionLeft' },
  { value: 'bottom-center', key: 'poster.positionCenter' },
  { value: 'top-right', key: 'poster.presetTopRight' },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function QrPlaceholder() {
  return (
    <div className="grid h-full w-full grid-cols-5 gap-[1px] bg-white p-[8%]" aria-hidden="true">
      {Array.from({ length: 25 }).map((_, index) => (
        <span
          key={index}
          className={(index * 7 + Math.floor(index / 5) * 3) % 5 < 2 ? 'bg-celebra-night' : 'bg-white'}
        />
      ))}
    </div>
  );
}

export default function PosterQrEditor({
  src,
  qr,
  caption,
  onChange,
  onImageMeta,
  t,
}) {
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);

  const current = useMemo(
    () =>
      qr || {
        size: QR_DEFAULT_SIZE,
        position: 'bottom-right',
        captionVisible: true,
        x: null,
        y: null,
      },
    [qr],
  );
  const explicit = hasExplicitPlacement(current);
  const captionVisible = current.captionVisible !== false;

  const applyPreset = useCallback(
    (position, size = current.size || QR_DEFAULT_SIZE, visible = captionVisible) => {
      if (!natural.width || !natural.height) return;
      onChange(
        resolveQrPreset({
          position,
          size,
          width: natural.width,
          height: natural.height,
          caption: visible ? caption : '',
          captionVisible: visible,
        }),
      );
    },
    [caption, captionVisible, current.size, natural.height, natural.width, onChange],
  );

  useEffect(() => {
    if (!natural.width || explicit) return;
    applyPreset(current.position || 'bottom-right', current.size);
  }, [applyPreset, current.position, current.size, explicit, natural.width]);

  useEffect(() => {
    if (!dragging) return undefined;

    const handleMove = (event) => {
      const drag = dragRef.current;
      const image = imageRef.current;
      if (!drag || !image) return;

      const rect = image.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const ratio = rect.width / rect.height;
      const dx = (event.clientX - drag.startX) / rect.width;
      const dy = (event.clientY - drag.startY) / rect.height;

      if (drag.kind === 'resize') {
        const maxSize = Math.min(1 - drag.x, (1 - drag.y) / ratio);
        const size = clamp(drag.size + dx, QR_MIN_SIZE, Math.max(QR_MIN_SIZE, maxSize));
        onChange({
          ...current,
          x: round(clamp(drag.x, 0, 1 - size)),
          y: round(clamp(drag.y, 0, 1 - size * ratio)),
          size: round(size),
          position: 'custom',
        });
        return;
      }

      const size = drag.size;
      onChange({
        ...current,
        x: round(clamp(drag.x + dx, 0, 1 - size)),
        y: round(clamp(drag.y + dy, 0, Math.max(0, 1 - size * ratio))),
        size,
        position: 'custom',
      });
    };

    const stop = () => setDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [current, dragging, onChange]);

  const startDrag = (event, kind) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (!explicit) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      kind,
      startX: event.clientX,
      startY: event.clientY,
      x: current.x,
      y: current.y,
      size: current.size,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };

  const handleKeyDown = (event) => {
    if (!explicit) return;
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const image = imageRef.current;
    const rect = image?.getBoundingClientRect();
    const ratio = rect?.width && rect?.height ? rect.width / rect.height : 1;

    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      onChange({
        ...current,
        x: round(clamp(current.x + dx, 0, 1 - current.size)),
        y: round(clamp(current.y + dy, 0, Math.max(0, 1 - current.size * ratio))),
        position: 'custom',
      });
      return;
    }

    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      const delta = event.key === '-' ? -step : step;
      const maxSize = Math.min(1 - current.x, (1 - current.y) / ratio);
      const size = clamp(current.size + delta, QR_MIN_SIZE, Math.max(QR_MIN_SIZE, maxSize));
      onChange({
        ...current,
        y: round(clamp(current.y, 0, Math.max(0, 1 - size * ratio))),
        size: round(size),
        position: 'custom',
      });
    }
  };

  const toggleCaption = (checked) => {
    if (current.position && current.position !== 'custom') {
      applyPreset(current.position, current.size, checked);
    } else {
      onChange({ ...current, captionVisible: checked });
    }
  };

  const handleImageLoad = (event) => {
    const image = event.currentTarget;
    const size = { width: image.naturalWidth, height: image.naturalHeight };
    setNatural(size);
    onImageMeta?.(size);
  };

  if (!src) return null;

  const customWarning =
    explicit &&
    (current.position === 'custom' || current.position === 'bottom-center' || current.position === 'top-right');
  const smallWarning = current.size < 0.18;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              current.position === preset.value
                ? 'border-celebra-gold bg-celebra-gold/10 text-celebra-night'
                : 'border-celebra-dark/15 text-celebra-dark/70 hover:border-celebra-gold/60'
            }`}
            onClick={() => applyPreset(preset.value)}
          >
            {t(preset.key)}
          </button>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-celebra-dark/15 px-3 py-1.5 text-xs font-medium text-celebra-dark/70 hover:border-celebra-gold/60"
          onClick={() => applyPreset('bottom-right', QR_DEFAULT_SIZE, captionVisible)}
        >
          <RotateCcw size={13} /> {t('poster.restoreRecommended')}
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-celebra-dark/15 bg-celebra-dark/5">
        <img
          ref={imageRef}
          src={src}
          alt={t('editor.posterAlt')}
          className="block h-auto w-full select-none"
          onLoad={handleImageLoad}
          draggable={false}
        />

        {explicit && natural.width > 0 && (
          <div
            className="absolute touch-none select-none"
            style={{
              left: `${current.x * 100}%`,
              top: `${current.y * 100}%`,
              width: `${current.size * 100}%`,
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label={t('poster.dragQr')}
              className={`relative aspect-square cursor-move rounded-[4px] border-[3px] border-white bg-white shadow-[0_2px_14px_rgba(0,0,0,0.35)] outline-none transition focus-visible:ring-2 focus-visible:ring-celebra-gold ${
                dragging ? 'ring-2 ring-celebra-gold' : ''
              }`}
              onPointerDown={(event) => startDrag(event, 'move')}
              onKeyDown={handleKeyDown}
            >
              <QrPlaceholder />
              <button
                type="button"
                aria-label={t('poster.resizeQr')}
                className="absolute -bottom-3 -right-3 flex h-11 w-11 items-end justify-end p-2"
                onPointerDown={(event) => startDrag(event, 'resize')}
              >
                <span className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-celebra-gold shadow" />
              </button>
            </div>
            {captionVisible && (
              <p className="mt-1 rounded bg-white/90 px-1 py-0.5 text-center text-[9px] font-semibold leading-tight text-celebra-night shadow-sm">
                {caption}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-celebra-dark/80">
          <input
            type="checkbox"
            checked={captionVisible}
            onChange={(event) => toggleCaption(event.target.checked)}
          />
          {t('poster.captionToggle')}
        </label>
        <span className="text-xs text-celebra-dark/45">{t('poster.dragHint')}</span>
      </div>

      {customWarning && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t('poster.overlapWarning')}
        </p>
      )}
      {smallWarning && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t('poster.smallWarning')}
        </p>
      )}
    </div>
  );
}
