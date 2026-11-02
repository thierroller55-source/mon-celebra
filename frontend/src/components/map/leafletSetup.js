import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Les chemins par defaut des icones Leaflet sont casses par les bundlers :
// on les remplace par les assets importes par Vite.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import { getPlanProviders, getDarkPlanProviders, SATELLITE_PROVIDER as SAT_PROV, OSM_ATTRIBUTION as OSM_ATTR, OSM_TILE_URL as OSM_URL } from '../../lib/map-tiles.ts';

export const OSM_ATTRIBUTION = OSM_ATTR;
export const OSM_TILE_URL = OSM_URL;

export const PLAN_PROVIDERS = getPlanProviders();
export const DARK_PLAN_PROVIDERS = getDarkPlanProviders();
export const SATELLITE_PROVIDER = SAT_PROV;

export default L;
