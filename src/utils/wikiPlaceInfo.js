/**
 * Fetch place info from Wikipedia (free, no API key)
 * Uses the MediaWiki API for search + page summary + thumbnail
 */

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_SEARCH = 'https://en.wikipedia.org/w/api.php';

/**
 * Search Wikipedia for a place name near given coordinates.
 * Returns { title, description, thumbnail, url } or null.
 */
export async function fetchPlaceInfo(name, coords) {
  if (!name && !coords) return null;

  try {
    // Strategy 1: Search by name first (more relevant results)
    if (name) {
      const info = await searchByName(name);
      if (info) return info;
    }

    // Strategy 2: Geosearch by coordinates
    if (coords) {
      const info = await searchByCoords(coords);
      if (info) return info;
    }

    return null;
  } catch {
    return null;
  }
}

async function searchByName(name) {
  // Use REST API summary endpoint for clean results
  const cleanName = name.replace(/[^\w\s-]/g, '').trim();
  if (!cleanName) return null;

  // Try direct page summary first
  try {
    const res = await fetch(`${WIKI_API}/page/summary/${encodeURIComponent(cleanName)}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.type === 'standard' || data.type === 'disambiguation') {
        return formatResult(data);
      }
    }
  } catch {}

  // Fallback: search API
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: cleanName,
      srlimit: '1',
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`${WIKI_SEARCH}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const title = data.query?.search?.[0]?.title;
    if (!title) return null;

    // Get summary for the found page
    const summaryRes = await fetch(`${WIKI_API}/page/summary/${encodeURIComponent(title)}`);
    if (!summaryRes.ok) return null;
    return formatResult(await summaryRes.json());
  } catch {
    return null;
  }
}

async function searchByCoords(coords) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${coords.lat}|${coords.lng}`,
    gsradius: '1000',
    gslimit: '3',
    format: 'json',
    origin: '*',
  });

  try {
    const res = await fetch(`${WIKI_SEARCH}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.geosearch;
    if (!pages?.length) return null;

    // Get summary for the closest result
    const summaryRes = await fetch(`${WIKI_API}/page/summary/${encodeURIComponent(pages[0].title)}`);
    if (!summaryRes.ok) return null;
    return formatResult(await summaryRes.json());
  } catch {
    return null;
  }
}

function formatResult(data) {
  if (!data) return null;

  const thumbnail = data.thumbnail?.source || data.originalimage?.source || null;
  const description = data.extract || data.description || null;

  if (!thumbnail && !description) return null;

  return {
    title: data.title || null,
    description: description ? truncate(description, 180) : null,
    thumbnail,
    url: data.content_urls?.desktop?.page || null,
  };
}

function truncate(str, max) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + '...';
}
