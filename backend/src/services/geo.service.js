/**
 * Geocodage via Nominatim (OpenStreetMap) + resolution des liens courts
 * Google Maps, avec cache memoire et respect de la politique d'usage
 * (1 requete/seconde max, User-Agent identifiable).
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MonCelebra/1.0 (+https://mon-celebra.vercel.app)';
const MAX_QUERY_LENGTH = 200;

const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

// --- Limiteur 1 req/s (file d'attente serialisee) ---------------------------
const MIN_GAP_MS = 1100;
let queue = Promise.resolve();
let lastCallAt = 0;

function schedule(task) {
  const run = queue.then(async () => {
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastCallAt));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    return task();
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function makeCacheKey(query, countrycodes) {
  return `${countrycodes || ''}::${String(query ?? '').trim().toLowerCase()}`;
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

export async function searchGeo(query, countrycodes = 'sn') {
  const q = String(query ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  if (q.length < 2) return [];

  // Restreint a un code pays (ex: "sn") ; vide = monde entier.
  const cc = String(countrycodes ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z,]/g, '')
    .slice(0, 40);

  const key = makeCacheKey(q, cc);
  const cached = getCached(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '5',
    addressdetails: '1',
  });
  if (cc) params.set('countrycodes', cc);

  try {
    const results = await schedule(async () => {
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      });
      if (!res.ok) return [];
      return res.json();
    });

    const normalized = (results || [])
      .map((r) => ({
        displayName: r.display_name,
        lat: Number(r.lat),
        lon: Number(r.lon),
        address: r.address,
      }))
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));

    setCached(key, normalized);
    return normalized;
  } catch {
    return [];
  }
}

// --- Resolution des liens courts Google Maps --------------------------------

const ALLOWED_HOST_SUFFIXES = ['goo.gl', 'g.co', 'google.com', 'google.sn'];

function isAllowedHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function extractCoords(url) {
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

/**
 * Suit un lien court Google Maps et en extrait [lat, lng].
 * @returns {Promise<{lat:number,lng:number,url:string}|null>}
 */
export async function resolveMapLink(input) {
  const raw = String(input ?? '').trim().slice(0, 2000);
  if (!raw) return null;

  let target;
  try {
    target = new URL(raw);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(target.protocol) || !isAllowedHost(target.hostname)) return null;

  // Lien long : extraction directe, sans requete reseau.
  const direct = extractCoords(raw);
  if (direct) return { ...direct, url: raw };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(raw, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    });
    const finalUrl = res.url || raw;
    if (!isAllowedHost(new URL(finalUrl).hostname)) return null;
    const coords = extractCoords(finalUrl);
    return coords ? { ...coords, url: finalUrl } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
