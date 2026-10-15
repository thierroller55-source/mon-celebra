import { useCallback, useRef, useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { TILE_PROVIDERS } from './leafletSetup.js';

const ERRORS_BEFORE_SWITCH = 3;

export default function MapTiles() {
  const [index, setIndex] = useState(0);
  const errorsRef = useRef(0);
  const provider = TILE_PROVIDERS[index];

  const handleTileError = useCallback(() => {
    errorsRef.current += 1;
    if (errorsRef.current >= ERRORS_BEFORE_SWITCH && index < TILE_PROVIDERS.length - 1) {
      errorsRef.current = 0;
      setIndex((current) => current + 1);
    }
  }, [index]);

  return (
    <TileLayer
      key={provider.key}
      url={provider.url}
      attribution={provider.attribution}
      eventHandlers={{ tileerror: handleTileError }}
    />
  );
}
