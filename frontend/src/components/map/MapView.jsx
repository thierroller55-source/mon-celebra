import { useEffect } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import MapTiles from './MapTiles.jsx';

function Recenter({ latitude, longitude }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude]);
  }, [map, latitude, longitude]);
  return null;
}

export default function MapView({ latitude, longitude, label, zoom = 15, className = 'h-64' }) {
  const position = [Number(latitude), Number(longitude)];
  if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) return null;

  return (
    <div className={`relative z-0 overflow-hidden rounded-xl ${className}`}>
      <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
        <MapTiles />
        <Marker position={position}>
          {label && <Popup>{label}</Popup>}
        </Marker>
        <Recenter latitude={position[0]} longitude={position[1]} />
      </MapContainer>
    </div>
  );
}
