/**
 * Centralized API configuration for development and production.
 * - In dev: uses relative URLs (proxied to backend via package.json "proxy")
 * - Set REACT_APP_API_URL to override (e.g., http://localhost:5000)
 */
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? '' : '');

/**
 * Build full API URL for a given path.
 * @param {string} path - API path (e.g., '/api/upload', '/api/results')
 * @returns {string} Full URL
 */
export const getApiUrl = (path) => {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (!path || typeof path !== 'string') return base || '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
};

/**
 * Build full image URL for a given path.
 * Handles relative paths like /Images_input/xxx.jpg
 * @param {string} path - Image path (e.g., '/Images_input/image-xxx.jpg')
 * @returns {string} Full URL for fetch/img src
 */
export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('blob:')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
};

/**
 * Check if API is configured.
 * @returns {boolean}
 */
export const isApiConfigured = () => !!API_BASE_URL;

const apiConfig = { getApiUrl, getImageUrl, isApiConfigured, API_BASE_URL };
export { apiConfig as default };
