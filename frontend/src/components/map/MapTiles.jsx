import { useCallback, useRef, useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  DARK_PLAN_PROVIDERS,
  PLAN_PROVIDERS,
  SATELLITE_PROVIDER,
} from './leafletSetup.js';

const ERRORS_BEFORE_SWITCH = 3;

/**
 * Couche de tuiles. En mode "plan", bascule automatiquement sur le fournisseur
 * suivant si le premier est bloque (adblock, filtrage reseau, DNS).
 * En theme sombre, utilise un fond de carte dedie.
 *
 * @param {{ mode?: 'plan'|'satellite' }} props
 */
export default function MapTiles({ mode = 'plan' }) {
  const { isDark } = useTheme();
  const [index, setIndex] = useState(0);
  const errorCount = useRef(0);

  const providers =
    mode === 'satellite' ? [SATELLITE_PROVIDER] : isDark ? DARK_PLAN_PROVIDERS : PLAN_PROVIDERS;

  const handleTileError = useCallback(() => {
    errorCount.current += 1;
    if (errorCount.current >= ERRORS_BEFORE_SWITCH && index < providers.length - 1) {
      errorCount.current = 0;
      setIndex((current) => current + 1);
    }
  }, [index, providers.length]);

  const provider = providers[Math.min(index, providers.length - 1)];

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
