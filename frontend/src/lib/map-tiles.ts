/**
 * Configuration centralisée des tuiles de carte.
 * Un seul module pour tous les fournisseurs de tuiles.
 */

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function getCartoKey() {
  // Vite env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_CARTO_KEY || import.meta.env.NEXT_PUBLIC_CARTO_KEY || null;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_CARTO_KEY || process.env.VITE_CARTO_KEY || null;
  }
  return null;
}

function buildCartoVoyagerUrl(key) {
  if (key) {
    // CARTO requires api_key parameter for raster basemaps
    return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(key)}`;
  }
  // Without key, CARTO may show watermark; we'll rely on fallback to OSM
  return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`;
}

function buildCartoDarkUrl(key) {
  if (key) {
    return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(key)}`;
  }
  return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`;
}

export function getPlanProviders() {
  const key = getCartoKey();
  const providers = [];
  // Try CARTO first if we have key, otherwise prefer OSM as primary to avoid watermark
  if (key) {
    providers.push({
      key: 'carto-voyager',
      url: buildCartoVoyagerUrl(key),
      attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    });
  }
  providers.push({
    key: 'osm',
    url: OSM_TILE_URL,
    attribution: OSM_ATTRIBUTION,
  });
  // Add CARTO as fallback if we have key or even without (as last resort)
  if (!key) {
    providers.push({
      key: 'carto-voyager',
      url: buildCartoVoyagerUrl(key),
      attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    });
  }
  return providers;
}

export function getDarkPlanProviders() {
  const key = getCartoKey();
  const providers = [];
  if (key) {
    providers.push({
      key: 'carto-dark',
      url: buildCartoDarkUrl(key),
      attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    });
  }
  providers.push({
    key: 'osm',
    url: OSM_TILE_URL,
    attribution: OSM_ATTRIBUTION,
  });
  if (!key) {
    providers.push({
      key: 'carto-dark',
      url: buildCartoDarkUrl(key),
      attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    });
  }
  return providers;
}

export const SATELLITE_PROVIDER = {
  key: 'esri',
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
};

export function hasCartoKey() {
  return Boolean(getCartoKey());
}
