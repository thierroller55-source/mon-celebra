import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { eventService } from '../../services/event.service.js';

/**
 * Vignette du QR code de l'evenement (image generee cote backend).
 * @param {object} props
 * @param {string} props.eventId
 * @param {string} props.className
 */
export default function QrThumb({ eventId, className = '' }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const urlRef = useRef('');

  useEffect(() => {
    let active = true;
    eventService
      .fetchQrBlobUrl(eventId)
      .then((blobUrl) => {
        if (!active) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        urlRef.current = blobUrl;
        setUrl(blobUrl);
      })
      .catch(() => active && setFailed(true));

    return () => {
      active = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [eventId]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center text-center text-xs text-celebra-dark/50 ${className}`}
      >
        QR indisponible
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="animate-spin text-celebra-dark/40" size={20} />
      </div>
    );
  }

  return <img src={url} alt="QR code de l'invitation" className={className} />;
}
