import { useCallback, useEffect, useRef, useState } from 'react';
import { eventService } from '../services/event.service.js';
import { getErrorMessage } from '../services/api.js';
import { composePosterWithQr, publicEventUrl } from '../lib/poster.js';

/**
 * Compose l'affiche + QR code de l'evenement et expose un Blob + une URL
 * d'apercu (mise en cache d'objet URL, liberee au demontage).
 *
 * @param {object|null} event
 * @param {{ position?: 'bottom-right'|'bottom-left'|'bottom-center' }} [options]
 */
export function useComposedPoster(event, { position = 'bottom-right' } = {}) {
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const urlRef = useRef('');

  const eventId = event?._id;
  const slug = event?.slug;
  const hasPoster = Boolean(event?.mainImage?.url);

  const generate = useCallback(async () => {
    if (!eventId || !hasPoster) {
      setError("Aucune affiche n'a ete importee pour cet evenement.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const posterBlob = await eventService.fetchPosterBlob(eventId);
      const composed = await composePosterWithQr({
        posterUrl: posterBlob,
        qrUrl: publicEventUrl(slug),
        position,
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
  }, [eventId, hasPoster, slug, position]);

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
