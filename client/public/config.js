/**
 * Bangladesh Carrom Federation (BCF)
 * Frontend Runtime Configuration
 *
 * Customize API & Server URLs here without rebuilding React/Vite.
 */
window.__BCF_CONFIG__ = {
  // Production URL for Backend API
  // Leave empty to auto-use '/api' on current domain, or specify: 'https://bcf.org.bd/api'
  API_URL: window.location.origin + '/api',

  // Production Server Root URL (for static uploads like /uploads/...)
  SERVER_URL: window.location.origin,

  // Client Portal URL
  CLIENT_URL: window.location.origin
};

