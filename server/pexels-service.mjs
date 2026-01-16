// Pexels API integration for stock images
// Documentation: https://www.pexels.com/api/documentation/

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

if (!PEXELS_API_KEY) {
  console.warn('[pexels] PEXELS_API_KEY not found in .env - stock image features will be disabled');
}

/**
 * Search for photos on Pexels
 * @param {string} query - Search term (e.g., "business meeting", "technology")
 * @param {number} perPage - Number of results (max 80)
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>} Search results with photos array
 */
export async function searchPhotos(query, perPage = 10, page = 1) {
  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API key not configured');
  }

  const url = new URL(`${PEXELS_BASE_URL}/search`);
  url.searchParams.append('query', query);
  url.searchParams.append('per_page', Math.min(perPage, 80).toString());
  url.searchParams.append('page', page.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': PEXELS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Transform to simpler format
  return {
    photos: data.photos.map(photo => ({
      id: photo.id,
      url: photo.src.large2x, // High quality image
      thumbnail: photo.src.medium,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      avg_color: photo.avg_color,
      alt: photo.alt || query,
    })),
    total_results: data.total_results,
    page: data.page,
    per_page: data.per_page,
  };
}

/**
 * Get a single photo by ID
 * @param {number} photoId - Pexels photo ID
 */
export async function getPhoto(photoId) {
  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API key not configured');
  }

  const response = await fetch(`${PEXELS_BASE_URL}/photos/${photoId}`, {
    headers: {
      'Authorization': PEXELS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`);
  }

  const photo = await response.json();

  return {
    id: photo.id,
    url: photo.src.large2x,
    thumbnail: photo.src.medium,
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
    avg_color: photo.avg_color,
    alt: photo.alt,
  };
}

/**
 * Get curated photos (hand-picked by Pexels team)
 * @param {number} perPage - Number of results (max 80)
 * @param {number} page - Page number
 */
export async function getCuratedPhotos(perPage = 15, page = 1) {
  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API key not configured');
  }

  const url = new URL(`${PEXELS_BASE_URL}/curated`);
  url.searchParams.append('per_page', Math.min(perPage, 80).toString());
  url.searchParams.append('page', page.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': PEXELS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    photos: data.photos.map(photo => ({
      id: photo.id,
      url: photo.src.large2x,
      thumbnail: photo.src.medium,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      avg_color: photo.avg_color,
      alt: photo.alt,
    })),
    page: data.page,
    per_page: data.per_page,
  };
}
