/**
 * Permalink utility for compressing and decompressing prompt/response data
 */

// Simple base64 encoding/decoding with URL-safe characters
function encodeData(data) {
  return btoa(encodeURIComponent(JSON.stringify(data)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function decodeData(encoded) {
  try {
    const decoded = atob(encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(decoded));
  } catch (e) {
    console.error('Failed to decode permalink data:', e);
    return null;
  }
}

// Compress prompt and response into a single string
function createPermalink(prompt, response) {
  const data = { prompt, response };
  return encodeData(data);
}

// Decompress permalink string back to prompt and response
function parsePermalink(permalink) {
  if (!permalink) return null;
  
  const decoded = decodeData(permalink);
  if (decoded && typeof decoded === 'object' && decoded.prompt !== undefined) {
    return { prompt: decoded.prompt, response: decoded.response || '' };
  }
  
  return null;
}

module.exports = {
  createPermalink,
  parsePermalink
};