/**
 * Recherche d'adresses via Nominatim (OpenStreetMap) avec cache en memoire
 * pour limiter les appels et respecter la politique d'usage (1 req/s).
 */

const cache = new Map();

/** TTL cache : 1 heure. */
const CACHE_TTL_MS = 60 * 60 * 1000;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function makeCacheKey(query) {
  return String(query ?? '').trim().toLowerCase();
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function searchGeo(query) {
  const q = String(query ?? '').trim();
  if (q.length < 2) return [];

  const key = makeCacheKey(q);
  const cached = getCached(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '10',
    addressdetails: '1',
  });

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'MonCelebra/1.0 (+https://moncelebra.com)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];

    const results = await res.json();
    const normalized = results.map((r) => ({
      displayName: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
      address: r.address,
    }));
    setCached(key, normalized);
    return normalized;
  } catch {
    return [];
  }
}
