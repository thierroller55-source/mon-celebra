import { useCallback, useRef, useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { PLAN_PROVIDERS, SATELLITE_PROVIDER } from './leafletSetup.js';

const ERRORS_BEFORE_SWITCH = 3;

/**
 * Couche de tuiles. En mode "plan", bascule automatiquement sur le fournisseur
 * suivant si le premier est bloque (adblock, filtrage reseau, DNS).
 *
 * @param {{ mode?: 'plan'|'satellite' }} props
 */
export default function MapTiles({ mode = 'plan' }) {
  const [index, setIndex] = useState(0);
  const errorCount = useRef(0);

  const handleTileError = useCallback(() => {
    errorCount.current += 1;
    if (errorCount.current >= ERRORS_BEFORE_SWITCH && index < PLAN_PROVIDERS.length - 1) {
      errorCount.current = 0;
      setIndex((current) => current + 1);
    }
  }, [index]);

  const provider = mode === 'satellite' ? SATELLITE_PROVIDER : PLAN_PROVIDERS[index];

  return (
    <TileLayer
      key={provider.key}
      url={provider.url}
      attribution={provider.attribution}
      maxZoom={19}
      eventHandlers={{ tileerror: handleTileError }}
    />
  );
}
