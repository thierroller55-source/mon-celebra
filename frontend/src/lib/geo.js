/**
 * Convention unique des coordonnees (source de verite) :
 *   - Stockage MongoDB / GeoJSON : { type: 'Point', coordinates: [lng, lat] }
 *   - Leaflet                    : [lat, lng]
 * Toujours passer par toLeaflet()/toGeoJSON() pour eviter les inversions.
 */

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

/** True si (lat, lng) sont deux nombres finis dans les bornes valides. */
export function isValidLatLng(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  return (
    Number.isFinite(la) &&
    Number.isFinite(ln) &&
    la >= LAT_MIN &&
    la <= LAT_MAX &&
    ln >= LNG_MIN &&
    ln <= LNG_MAX
  );
}

/**
 * True des qu'une position exploitable existe.
 * Guard critique : ne JAMAIS utiliser Number.isFinite(Number(x)) puisque
 * Number('') === 0 (position 0,0 en plein ocean). On rejette explicitement
 * null/undefined/chaine vide.
 */
export function hasGeo(lat, lng) {
  if (lat === null || lat === undefined || lat === '') return false;
  if (lng === null || lng === undefined || lng === '') return false;
  return isValidLatLng(lat, lng);
}

/** GeoJSON -> centre Leaflet [lat, lng]. */
export function toLeaflet(geo) {
  if (!geo || geo.type !== 'Point' || !Array.isArray(geo.coordinates)) return null;
  const [lng, lat] = geo.coordinates;
  return hasGeo(lat, lng) ? [Number(lat), Number(lng)] : null;
}

/** (lat, lng) -> objet GeoJSON [lng, lat]. */
export function toGeoJSON(lat, lng) {
  if (!hasGeo(lat, lng)) return undefined;
  return { type: 'Point', coordinates: [Number(lng), Number(lat)] };
}

/** Arrondi 6 decimales (~11 cm) pour l'affichage et l'enregistrement. */
export function roundCoord(value) {
  return Number(Number(value).toFixed(6));
}

/** "14.767156, -17.396711" */
export function formatCoords(lat, lng) {
  if (!hasGeo(lat, lng)) return '';
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
}

export function googleMapsSearchUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function googleMapsDirUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function wazeUrl(lat, lng) {
  return `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;
}

export const DEFAULT_CENTER = [14.7167, -17.4677]; // Dakar
export const DEFAULT_ZOOM = 13;
export const POINT_ZOOM = 16;

/**
 * Extrait [lat, lng] d'un lien Google Maps "long".
 * Formats supportes : .../@lat,lng,zoom   ?q=lat,lng   !3dlat!4dlng
 * Retourne null si rien de trouvable.
 */
export function parseGoogleMapsUrl(input) {
  if (!input) return null;
  const url = String(input).trim();
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (hasGeo(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

/** True si le lien est un lien court Google Maps (needs serveur pour resoudre). */
export function isShortMapsLink(input) {
  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\b/i.test(
    String(input || '').trim(),
  );
}
