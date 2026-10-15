import { useEffect } from 'react';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import MapTiles from './MapTiles.jsx';

const DEFAULT_CENTER = [14.6928, -17.4467]; // Dakar

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ latitude, longitude }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      map.setView([latitude, longitude]);
    }
  }, [map, latitude, longitude]);
  return null;
}

export default function MapPicker({ latitude, longitude, onChange, className = 'h-64' }) {
  const hasPoint = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const center = hasPoint ? [Number(latitude), Number(longitude)] : DEFAULT_CENTER;

  return (
    <div className={`relative z-0 overflow-hidden rounded-xl ${className}`}>
      <MapContainer center={center} zoom={hasPoint ? 15 : 12} scrollWheelZoom className="h-full w-full">
        <MapTiles />
        <ClickHandler onPick={onChange} />
        {hasPoint && <Marker position={[Number(latitude), Number(longitude)]} />}
        <Recenter latitude={Number(latitude)} longitude={Number(longitude)} />
      </MapContainer>
    </div>
  );
}
