import { useState } from 'react';
import { Calendar, MapPin, Clock, Navigation, Copy, Check } from 'lucide-react';
import Countdown from '../components/event/Countdown.jsx';
import RsvpSection from '../components/event/RsvpSection.jsx';
import GuestbookSection from '../components/event/GuestbookSection.jsx';
import ReportButton from '../components/event/ReportButton.jsx';
import MapView from '../components/map/MapView.jsx';
import DetailsRenderer from './DetailsRenderer.jsx';
import { googleMapsDirUrl, googleMapsSearchUrl, wazeUrl } from '../lib/geo.js';

const VARIANTS = {
  classic: {
    hero: 'bg-gradient px-4 py-16 text-center sm:py-24',
    heroText: 'text-white',
    title: 'mx-auto max-w-3xl font-heading text-3xl font-bold sm:text-5xl',
    subtitle: 'mx-auto mt-3 max-w-xl text-white/85',
    container: 'mx-auto w-full max-w-3xl px-4 py-12',
    sectionTitle: 'mb-6 text-center text-xl font-bold',
    background: true,
  },
  modern: {
    hero: 'bg-gradient px-4 py-16 text-left sm:py-24',
    heroText: 'text-white',
    title: 'max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-6xl',
    subtitle: 'mt-3 max-w-xl text-white/85',
    container: 'mx-auto w-full max-w-4xl px-4 py-12',
    sectionTitle: 'mb-6 text-left text-xl font-bold',
    background: true,
  },
  bold: {
    hero: 'bg-gradient px-4 py-20 text-center sm:py-32',
    heroText: 'text-white',
    title: 'mx-auto max-w-4xl font-heading text-4xl font-extrabold uppercase tracking-wide sm:text-6xl',
    subtitle: 'mx-auto mt-3 max-w-2xl text-white/90',
    container: 'mx-auto w-full max-w-3xl px-4 py-12',
    sectionTitle: 'mb-6 text-center text-2xl font-bold uppercase tracking-wide',
    background: true,
  },
  elegant: {
    hero: 'bg-gradient px-4 py-16 text-center sm:py-24',
    heroText: 'text-white',
    title: 'mx-auto max-w-3xl font-heading text-3xl font-bold italic sm:text-5xl',
    subtitle: 'mx-auto mt-3 max-w-xl italic text-white/85',
    container: 'mx-auto w-full max-w-3xl px-4 py-12',
    sectionTitle: 'mb-6 text-center font-heading text-xl font-bold',
    background: true,
  },
  minimal: {
    hero: 'border-b border-celebra-dark/10 bg-white px-4 py-16 text-center sm:py-24',
    heroText: 'text-celebra-dark',
    title: 'mx-auto max-w-3xl font-heading text-3xl font-bold sm:text-5xl',
    subtitle: 'mx-auto mt-3 max-w-xl text-celebra-dark/70',
    container: 'mx-auto w-full max-w-3xl px-4 py-12',
    sectionTitle: 'mb-6 text-center text-xl font-bold',
    background: false,
  },
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function locationMapsUrl(location, mode = 'search') {
  return mode === 'dir'
    ? googleMapsDirUrl(location.latitude, location.longitude)
    : googleMapsSearchUrl(location.latitude, location.longitude);
}

function CopyAddressButton({ location }) {
  const [copied, setCopied] = useState(false);
  const text = location.address || `${location.name || location.label || ''} (${location.latitude}, ${location.longitude})`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papier indisponible */
    }
  };
  return (
    <button type="button" className="btn-outline w-full" onClick={handleCopy}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Adresse copiee' : "Copier l'adresse"}
    </button>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function calendarUrl(slug, accessCode) {
  const suffix = accessCode ? `?code=${encodeURIComponent(accessCode)}` : '';
  return `${API_BASE}/public/events/${slug}/calendar.ics${suffix}`;
}

/**
 * Rendu public generique d'un evenement.
 * @param {object} props
 * @param {object} props.event
 * @param {object|null} props.category  Categorie (avec fieldsSchema.fields).
 * @param {string} props.variant        'classic' | 'modern' | 'bold' | 'elegant' | 'minimal'
 */
export default function EventTemplate({ event, category = null, variant = 'classic', accessCode = '' }) {
  const style = VARIANTS[variant] || VARIANTS.classic;
  const design = event.design || {};
  const primary = design.primaryColor || '#B08D57';
  const secondary = design.secondaryColor || '#1F2937';
  const headline = design.customTexts?.headline || event.title;
  const locations = [event.location, ...(event.locations || [])].filter(
    (loc) => loc && (loc.name || loc.address),
  );
  const detailsFields = category?.fieldsSchema?.fields || [];

  const heroStyle = style.background
    ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` }
    : undefined;

  return (
    <article>
      {event.mainImage?.url && (
        <div className="flex justify-center bg-celebra-dark/5">
          <img
            src={event.mainImage.url}
            alt={headline || 'Affiche de l\'evenement'}
            className="max-h-[80vh] w-full object-contain"
          />
        </div>
      )}
      <header className={style.hero} style={heroStyle}>
        <p className={`mb-2 text-sm uppercase tracking-widest ${style.heroText} opacity-80`}>
          {category?.name || event.category}
        </p>
        <h1 className={`${style.title} ${style.heroText}`}>{headline}</h1>
        {event.tagline && (
          <p className={`${style.subtitle}`} style={!style.background ? undefined : { color: 'rgba(255,255,255,0.85)' }}>
            {event.tagline}
          </p>
        )}
        {event.date && (
          <p
            className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
              style.background ? 'bg-white/15 text-white' : 'bg-celebra-gold/10 text-celebra-dark'
            }`}
          >
            <Calendar size={16} />
            {formatDate(event.date)}
            {event.startTime && ` · ${event.startTime}`}
          </p>
        )}
        {event.date && (
          <div className="mt-4">
            <a
              href={calendarUrl(event.slug, accessCode)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                style.background
                  ? 'bg-white text-celebra-dark hover:bg-white/90'
                  : 'bg-celebra-dark text-white hover:opacity-90'
              }`}
            >
              <Calendar size={16} />
              Ajouter a l&apos;agenda
            </a>
          </div>
        )}
      </header>

      <div className={style.container}>
        {event.settings?.countdownEnabled !== false && event.date && (
          <section className="mb-12">
            <Countdown date={event.date} startTime={event.startTime} accent={primary} />
          </section>
        )}

        {event.description && (
          <section className="mb-12 text-center">
            <p className="whitespace-pre-line text-celebra-dark/80">{event.description}</p>
          </section>
        )}

        <DetailsRenderer fields={detailsFields} details={event.details || {}} />

        {event.program?.length > 0 && (
          <section className="mb-12">
            <h2 className={style.sectionTitle}>Programme</h2>
            <ol className="space-y-4">
              {event.program.map((item, index) => (
                <li key={index} className="card flex items-start gap-4 p-4">
                  {item.time && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-medium text-white"
                      style={{ backgroundColor: primary }}
                    >
                      <Clock size={14} />
                      {item.time}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-celebra-dark/60">{item.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {locations.length > 0 && (
          <section className="mb-12">
            <h2 className={style.sectionTitle}>Lieu</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {locations.map((loc, index) => (
                <div key={index} className="card flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} style={{ color: primary }} />
                    <p className="font-semibold">{loc.label || loc.name}</p>
                  </div>
                  {loc.name && loc.label && (
                    <p className="-mt-2 text-sm text-celebra-dark/60">{loc.name}</p>
                  )}
                  {loc.address && <p className="text-sm text-celebra-dark/70">{loc.address}</p>}
                  {loc.latitude != null && loc.longitude != null && (
                    <>
                      <MapView
                        latitude={loc.latitude}
                        longitude={loc.longitude}
                        label={loc.name || loc.label}
                        className="h-48"
                      />
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <a
                          href={locationMapsUrl(loc, 'dir')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline w-full"
                        >
                          <Navigation size={16} />
                          Itineraire
                        </a>
                        <a
                          href={wazeUrl(loc.latitude, loc.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline w-full"
                        >
                          <Navigation size={16} />
                          Waze
                        </a>
                        <div className="col-span-2">
                          <CopyAddressButton location={loc} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {event.gallery?.length > 0 && (
          <section className="mb-12">
            <h2 className={style.sectionTitle}>Galerie</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {event.gallery.map((photo, index) => (
                <img
                  key={index}
                  src={photo.url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="aspect-square w-full rounded-xl object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        {event.settings?.rsvpEnabled !== false && (
          <div className="mb-12">
            <RsvpSection slug={event.slug} stats={event.stats} accent={primary} />
          </div>
        )}

        {event.settings?.guestbookEnabled !== false && (
          <GuestbookSection slug={event.slug} messages={event.guestbook || []} accent={primary} />
        )}

        <ReportButton eventId={event._id} />
      </div>
    </article>
  );
}
