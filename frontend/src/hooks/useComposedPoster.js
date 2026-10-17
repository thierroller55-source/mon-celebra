import { useCallback, useEffect, useRef, useState } from 'react';
import { eventService } from '../services/event.service.js';
import { getErrorMessage } from '../services/api.js';
import { composePosterWithQr, publicEventUrl } from '../lib/poster.js';
import i18n, { translatorFor } from '../i18n/index.js';

/**
 * Compose l'affiche + QR code de l'evenement et expose un Blob + une URL
 * d'apercu (mise en cache d'objet URL, liberee au demontage).
 *
 * La mention sous le QR est traduite dans la langue de l'EVENEMENT
 * (event.language), independamment de la langue de l'interface.
 */
export function useComposedPoster(event, { position = 'bottom-right' } = {}) {
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const urlRef = useRef('');

  const eventId = event?._id;
  const slug = event?.slug;
  const eventLanguage = event?.language || 'fr';
  const hasPoster = Boolean(event?.mainImage?.url);

  const generate = useCallback(async () => {
    if (!eventId || !hasPoster) {
      setError(i18n.t('poster.noPoster'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const posterBlob = await eventService.fetchPosterBlob(eventId);
      const caption = (await translatorFor(eventLanguage))('poster.caption');
      const composed = await composePosterWithQr({
        posterUrl: posterBlob,
        qrUrl: publicEventUrl(slug),
        position,
        caption,
      });
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(composed);
      setBlob(composed);
      setUrl(urlRef.current);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, hasPoster, slug, position, eventLanguage]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (active) await generate();
    };
    run();
    return () => {
      active = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = '';
    };
  }, [generate]);

  return { blob, url, loading, error, reload: generate };
}
