import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Copy, Navigation } from 'lucide-react';
import {
  appleMapsQueryUrl,
  appleMapsUrl,
  googleMapsDirQueryUrl,
  googleMapsDirUrl,
  hasGeo,
  wazeQueryUrl,
  wazeUrl,
} from '../../lib/geo.js';

/**
 * Bouton compact qui propose d'ouvrir l'itineraire vers un lieu dans
 * l'application de navigation de l'utilisateur (Google Maps, Waze, Apple Plans)
 * ou de copier l'adresse.
 */
export default function DirectionsButton({ location, className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  const { latitude, longitude } = location || {};
  const positioned = hasGeo(latitude, longitude);
  const address = [location?.address, location?.name, location?.label]
    .map((value) => String(value || '').trim())
    .find(Boolean);
  const destination = positioned ? `${latitude},${longitude}` : address;

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!location || !destination) return null;

  const copyText = address || destination;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papier indisponible */
    }
  };

  const apps = [
    {
      key: 'googleMaps',
      label: 'Google Maps',
      href: positioned
        ? googleMapsDirUrl(latitude, longitude)
        : googleMapsDirQueryUrl(destination),
    },
    {
      key: 'waze',
      label: t('publicPage.waze'),
      href: positioned ? wazeUrl(latitude, longitude) : wazeQueryUrl(destination),
    },
    {
      key: 'appleMaps',
      label: t('publicPage.appleMaps'),
      href: positioned ? appleMapsUrl(latitude, longitude) : appleMapsQueryUrl(destination),
    },
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        className="btn-outline w-full"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Navigation size={16} />
        {t('publicPage.itinerary')}
        <ChevronDown size={15} className={open ? 'rotate-180 transition' : 'transition'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-celebra-dark/10 bg-white shadow-lg"
        >
          {apps.map((app) => (
            <a
              key={app.key}
              role="menuitem"
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-celebra-gold/10"
              onClick={() => setOpen(false)}
            >
              <Navigation size={15} className="text-celebra-gold" />
              {app.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 border-t border-celebra-dark/10 px-4 py-3 text-left text-sm hover:bg-celebra-gold/10"
            onClick={handleCopy}
          >
            {copied ? (
              <Check size={15} className="text-celebra-gold" />
            ) : (
              <Copy size={15} className="text-celebra-gold" />
            )}
            {copied ? t('publicPage.addressCopied') : t('publicPage.copyAddress')}
          </button>
        </div>
      )}
    </div>
  );
}
