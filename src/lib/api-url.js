/**
 * Dynamic API URL Resolver for Desktop Electron App
 *
 * Problem: `NEXT_PUBLIC_API_BASE_URL` is baked into the JS bundle at build time.
 * When the app is served from a Server PC (e.g. http://192.168.1.55:5000) and
 * opened on a Client PC, `localhost:5000` in the bundle resolves to the CLIENT
 * PC's own localhost where nothing is running.
 *
 * Solution: At runtime, detect the actual server host from `window.location`
 * and build the API URL dynamically. Falls back to the build-time env var
 * for the Server PC itself (where localhost IS correct).
 */

const FALLBACK_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Returns the correct API base URL dynamically.
 * - If the page is loaded from a remote IP/hostname (i.e. a Client PC connecting
 *   to the Main Server PC), the URL is built from that same origin.
 * - If the page is loaded from localhost/127.0.0.1 (i.e. the Server PC itself),
 *   the baked-in env var is used as normal.
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    // Server-side rendering context — use the build-time env var
    return FALLBACK_API_BASE_URL;
  }

  const { hostname, port } = window.location;

  // If loading from localhost or 127.0.0.1, we're on the Server PC itself.
  // No change needed — use the built-in env var which correctly points to localhost.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return FALLBACK_API_BASE_URL;
  }

  // Otherwise, we are a Client PC loading the app from a remote host.
  // Build the API URL dynamically using the same origin the page came from.
  const serverPort = port || '5000';
  return `http://${hostname}:${serverPort}/api/v1`;
}

/**
 * Returns just the base server URL (without /api/v1) for image loading, etc.
 */
export function getImageBaseUrl() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost:5000';
  }

  const { hostname, port } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost:5000';
  }

  const serverPort = port || '5000';
  return `http://${hostname}:${serverPort}`;
}
