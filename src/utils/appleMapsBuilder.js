/**
 * Build Apple Maps URLs from parsed Google Maps data
 * Apple Maps URL scheme: https://maps.apple.com/?<params>
 *
 * Key Apple Maps parameters:
 *   q      - search query / place name
 *   ll     - latitude,longitude (center)
 *   z      - zoom level (1-20)
 *   t      - map type: m=standard, s=satellite, h=hybrid, r=transit
 *   saddr  - directions source address
 *   daddr  - directions destination address
 *   dirflg - directions mode: d=driving, w=walking, r=transit
 *   near   - biasing location for search
 */

const APPLE_MAPS_BASE = 'https://maps.apple.com/';

/**
 * Convert Google zoom level to Apple zoom level
 * They use similar scales but Apple tends to be slightly different
 */
function normalizeZoom(googleZoom) {
  if (!googleZoom) return 15;
  return Math.round(Math.min(20, Math.max(1, googleZoom)));
}

/**
 * Build an Apple Maps URL from parsed Google Maps data
 */
export function buildAppleMapsUrl(parsed) {
  if (!parsed || parsed.error) return null;

  const params = new URLSearchParams();

  if (parsed.type === 'short') {
    // Can't do much with an unresolved short URL
    return null;
  }

  if (parsed.type === 'directions' && parsed.directions) {
    const { from, to } = parsed.directions;
    if (from) params.set('saddr', from);
    if (to) params.set('daddr', to);
    return APPLE_MAPS_BASE + '?' + params.toString();
  }

  // Place / search / coords
  if (parsed.coords) {
    const { lat, lng } = parsed.coords;
    params.set('ll', `${lat},${lng}`);
    params.set('z', String(normalizeZoom(parsed.zoom)));

    if (parsed.name) {
      params.set('q', parsed.name);
    }
  } else if (parsed.name || parsed.query) {
    // Name-only search
    params.set('q', parsed.name || parsed.query);
    if (parsed.coords) {
      params.set('near', `${parsed.coords.lat},${parsed.coords.lng}`);
    }
  }

  if (!params.toString()) return null;

  return APPLE_MAPS_BASE + '?' + params.toString();
}

/**
 * Format coordinates for display
 */
export function formatCoords(coords) {
  if (!coords) return null;
  const latDir = coords.lat >= 0 ? 'N' : 'S';
  const lngDir = coords.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(coords.lat).toFixed(5)}°${latDir}, ${Math.abs(coords.lng).toFixed(5)}°${lngDir}`;
}
