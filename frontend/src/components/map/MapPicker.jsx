import { useEffect, useState } from 'react';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Layers } from 'lucide-react';
import MapTiles from './MapTiles.jsx';
import { hasGeo, DEFAULT_CENTER, DEFAULT_ZOOM, POINT_ZOOM } from '../../lib/geo.js';

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Recentre la carte quand la position change (uniquement si valide). */
function Recenter({ latitude, longitude, valid }) {
  const map = useMap();
  useEffect(() => {
    if (valid) map.setView([latitude, longitude], POINT_ZOOM);
  }, [map, latitude, longitude, valid]);
  return null;
}

/** Corrige le dimensionnement quand la carte apparait (onglet, accordeon...). */
function SizeFixer() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const timers = [setTimeout(fix, 0), setTimeout(fix, 250)];
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fix) : null;
    if (observer) observer.observe(map.getContainer());
    return () => {
      timers.forEach(clearTimeout);
      observer?.disconnect();
    };
  }, [map]);
  return null;
}

/**
 * Carte de selection d'un lieu (editeur).
 * - clic sur la carte pour placer le marqueur
 * - marqueur deplacable (drag)
 *
 * @param {object} props
 * @param {number|string} props.latitude
 * @param {number|string} props.longitude
 * @param {(lat:number,lng:number)=>void} props.onChange
 */
export default function MapPicker({ latitude, longitude, onChange, className = '' }) {
  const valid = hasGeo(latitude, longitude);
  const lat = valid ? Number(latitude) : null;
  const lng = valid ? Number(longitude) : null;
  const center = valid ? [lat, lng] : DEFAULT_CENTER;
  const [mode, setMode] = useState('plan');

  return (
    <div
      className={`relative z-0 h-80 overflow-hidden rounded-xl sm:h-[400px] ${className}`.trim()}
    >
      <button
        type="button"
        onClick={() => setMode((m) => (m === 'plan' ? 'satellite' : 'plan'))}
        className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-lg border border-celebra-dark/10 bg-celebra-paper/95 px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-celebra-paper"
        title="Basculer Plan / Satellite"
      >
        <Layers size={14} />
        {mode === 'plan' ? 'Satellite' : 'Plan'}
      </button>

      <MapContainer
        center={center}
        zoom={valid ? POINT_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <MapTiles mode={mode} />
        <ClickHandler onPick={onChange} />
        <SizeFixer />
        {valid && (
          <Marker
            position={[lat, lng]}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat: la, lng: ln } = e.target.getLatLng();
                onChange(la, ln);
              },
            }}
          />
        )}
        <Recenter latitude={lat} longitude={lng} valid={valid} />
      </MapContainer>
    </div>
  );
}
