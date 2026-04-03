/**
 * Robust Google Maps URL parser
 * Handles all known Google Maps URL formats and extracts structured location data
 */

/**
 * Extract coordinates from the @LAT,LNG,ZOOMz portion of a path
 */
function extractCoordsFromPath(pathname) {
  const match = pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      zoom: parseFloat(match[3]),
    };
  }
  // Try without zoom
  const matchNoZoom = pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (matchNoZoom) {
    return {
      lat: parseFloat(matchNoZoom[1]),
      lng: parseFloat(matchNoZoom[2]),
      zoom: 15,
    };
  }
  return null;
}

/**
 * Extract place name from Google Maps URL pathname
 */
function extractPlaceName(pathname) {
  // /maps/place/Thai+Peacock/...
  const placeMatch = pathname.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  }
  // /maps/search/QUERY
  const searchMatch = pathname.match(/\/maps\/search\/([^/@]+)/);
  if (searchMatch) {
    return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
  }
  return null;
}

/**
 * Extract coordinates encoded in the data= parameter
 * The !3d and !4d markers encode lat/lng
 */
function extractCoordsFromData(search, pathname) {
  // Try !3dLAT!4dLNG pattern (high precision coords in data param)
  const fullUrl = pathname + search;
  const latMatch = fullUrl.match(/!3d(-?\d+\.?\d+)/);
  const lngMatch = fullUrl.match(/!4d(-?\d+\.?\d+)/);
  if (latMatch && lngMatch) {
    return {
      lat: parseFloat(latMatch[1]),
      lng: parseFloat(lngMatch[1]),
    };
  }
  return null;
}

/**
 * Extract directions info from a directions URL
 */
function extractDirections(pathname) {
  // /maps/dir/FROM/TO or /maps/dir//TO
  const dirMatch = pathname.match(/\/maps\/dir\/([^/]*)\/?([^/]*)/);
  if (dirMatch) {
    return {
      from: decodeURIComponent(dirMatch[1].replace(/\+/g, ' ')) || null,
      to: decodeURIComponent(dirMatch[2].replace(/\+/g, ' ')) || null,
    };
  }
  return null;
}

/**
 * Detect URL type
 */
function detectUrlType(url) {
  const hostname = url.hostname || '';
  const pathname = url.pathname || '';

  if (hostname === 'maps.app.goo.gl' || hostname === 'goo.gl') {
    return 'short';
  }
  if (pathname.includes('/maps/dir/')) {
    return 'directions';
  }
  if (pathname.includes('/maps/place/')) {
    return 'place';
  }
  if (pathname.includes('/maps/search/')) {
    return 'search';
  }
  if (pathname.includes('/maps/@')) {
    return 'coords';
  }
  if (pathname === '/maps' || pathname === '/maps/') {
    return 'query';
  }
  return 'unknown';
}

/**
 * Main parser: takes a Google Maps URL string and returns structured data
 */
export function parseGoogleMapsUrl(rawUrl) {
  let urlString = rawUrl.trim();

  // Add protocol if missing
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = 'https://' + urlString;
  }

  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { error: 'Invalid URL format' };
  }

  const hostname = url.hostname.replace(/^www\./, '');

  // Validate it's a Google Maps URL
  const validHosts = [
    'google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl',
  ];
  if (!validHosts.some(h => hostname === h || hostname.endsWith('.' + h))) {
    return { error: 'Not a recognized Google Maps URL' };
  }

  const type = detectUrlType(url);

  if (type === 'short') {
    return {
      type: 'short',
      originalUrl: urlString,
      shortCode: url.pathname.slice(1),
      error: null,
    };
  }

  const result = {
    type,
    originalUrl: urlString,
    error: null,
    name: null,
    coords: null,
    zoom: null,
    query: null,
    directions: null,
  };

  // Extract place name
  result.name = extractPlaceName(url.pathname);

  // Try path-based coordinates first (@lat,lng,zoom)
  const pathCoords = extractCoordsFromPath(url.pathname);
  if (pathCoords) {
    result.coords = { lat: pathCoords.lat, lng: pathCoords.lng };
    result.zoom = pathCoords.zoom;
  }

  // Try high-precision coords from data parameter (override path coords with these)
  const dataCoords = extractCoordsFromData(url.search, url.pathname);
  if (dataCoords) {
    result.coords = dataCoords;
  }

  // Query parameter fallback (q=lat,lng or q=place)
  const q = url.searchParams.get('q');
  if (q) {
    const coordMatch = q.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (coordMatch) {
      result.coords = result.coords || {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
      };
    } else {
      result.query = q;
      result.name = result.name || q;
    }
  }

  // Directions
  if (type === 'directions') {
    result.directions = extractDirections(url.pathname);
  }

  // Check if we have enough info
  if (!result.coords && !result.name && !result.query && !result.directions) {
    return { ...result, error: 'Could not extract location data from URL' };
  }

  return result;
}
