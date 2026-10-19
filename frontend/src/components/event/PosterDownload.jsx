import { useState } from 'react';
import { Loader2, Download, Share2, QrCode, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { eventService } from '../../services/event.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useComposedPoster } from '../../hooks/useComposedPoster.js';
import { downloadBlob, shareBlob, posterFileName } from '../../lib/poster.js';

/**
 * Affiche l'affiche avec le QR code incruste + boutons de telechargement/partage.
 * Bloc reutilise par le tableau de bord, l'apercu et la publication.
 */
export default function PosterDownload({
  event,
  showPosition = false,
  showShare = true,
  className = '',
}) {
  const toast = useToast();
  const { t } = useTranslation();
  const [position, setPosition] = useState('bottom-right');
  const { blob, url, loading, error, reload } = useComposedPoster(event, { position });
  const [busy, setBusy] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);

  const handleDownload = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      downloadBlob(blob, posterFileName(event.slug));
      toast.success(t('poster.downloaded'));
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!blob) return;
    const shared = await shareBlob(blob, posterFileName(event.slug), event.title);
    if (!shared) {
      downloadBlob(blob, posterFileName(event.slug));
      toast.success(t('poster.downloaded'));
    }
  };

  const handleQr = async () => {
    setQrBusy(true);
    try {
      const qrUrl = await eventService.fetchQrBlobUrl(event._id);
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `${event.slug}-qr.png`;
      link.click();
      URL.revokeObjectURL(qrUrl);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setQrBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex min-h-[12rem] items-center justify-center rounded-lg bg-celebra-dark/5 p-2">
        {loading && <Loader2 className="animate-spin text-celebra-dark/40" size={22} />}

        {!loading && error && (
          <div className="px-4 text-center text-sm text-celebra-dark/60">
            <p>{error}</p>
            <button type="button" className="btn-outline mt-3" onClick={reload}>
              <RefreshCw size={15} /> {t('common.retry')}
            </button>
          </div>
        )}

        {!loading && !error && url && (
          <img
            src={url}
            alt={t('poster.alt', { title: event.title })}
            className="max-h-80 w-full object-contain"
          />
        )}
      </div>

      {showPosition && (
        <div className="mt-3">
          <label htmlFor="qr-position" className="label">
            {t('poster.positionLabel')}
          </label>
          <select
            id="qr-position"
            className="input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="bottom-right">{t('poster.positionRight')}</option>
            <option value="bottom-left">{t('poster.positionLeft')}</option>
            <option value="bottom-center">{t('poster.positionCenter')}</option>
          </select>
        </div>
      )}

      {event.status !== 'published' && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{t('poster.draftWarning')}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={handleDownload}
          disabled={!blob || busy}
        >
          {loading || busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          {t('poster.download')}
        </button>

        {showShare && (
          <button type="button" className="btn-outline" onClick={handleShare} disabled={!blob || loading}>
            <Share2 size={15} /> {t('poster.share')}
          </button>
        )}

        <button
          type="button"
          className="btn-outline"
          onClick={handleQr}
          disabled={qrBusy}
          title={t('poster.qrTitle')}
        >
          {qrBusy ? <Loader2 className="animate-spin" size={15} /> : <QrCode size={15} />}
          {t('poster.downloadQr')}
        </button>
      </div>
    </div>
  );
}
