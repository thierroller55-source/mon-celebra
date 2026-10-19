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

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Fond de secours "plan" : si tuiles OSM bloquees (adblock, filtrage reseau,
// DNS), on bascule automatiquement sur le suivant.
export const PLAN_PROVIDERS = [
  { key: 'osm', url: OSM_TILE_URL, attribution: OSM_ATTRIBUTION },
  {
    key: 'carto',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
  },
];

// Fond "plan" sombre, pour le thème nuit.
export const DARK_PLAN_PROVIDERS = [
  {
    key: 'carto-dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
  },
  { key: 'osm', url: OSM_TILE_URL, attribution: OSM_ATTRIBUTION },
];

// Vue satellite (Esri World Imagery, gratuite, attribution requise).
export const SATELLITE_PROVIDER = {
  key: 'esri',
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
};

export default L;
