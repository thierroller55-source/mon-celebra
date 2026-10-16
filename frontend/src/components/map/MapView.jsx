import { useEffect } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import MapTiles from './MapTiles.jsx';
import { hasGeo } from '../../lib/geo.js';

function Recenter({ latitude, longitude }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude]);
  }, [map, latitude, longitude]);
  return null;
}

function SizeFixer() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const timers = [setTimeout(fix, 0), setTimeout(fix, 250)];
    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

/** Carte publique en lecture seule (aucune modification possible). */
export default function MapView({ latitude, longitude, label, zoom = 16, className = '' }) {
  if (!hasGeo(latitude, longitude)) return null;
  const position = [Number(latitude), Number(longitude)];

  return (
    <div
      className={`relative z-0 h-48 overflow-hidden rounded-xl ${className}`.trim()}
    >
      <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
        <MapTiles />
        <SizeFixer />
        <Marker position={position}>{label && <Popup>{label}</Popup>}</Marker>
        <Recenter latitude={position[0]} longitude={position[1]} />
      </MapContainer>
    </div>
  );
}
