/**
 * Bangladesh Carrom Federation (BCF)
 * Admin Panel Runtime Configuration
 *
 * Customize API & Server URLs here without rebuilding React/Vite.
 */
window.__BCF_CONFIG__ = {
  // If hosted on admin.bcf.org.bd or bcf.org.bd/admin:
  API_URL: (window.location.origin.includes('admin.')
    ? window.location.origin.replace('admin.', 'api.')
    : window.location.origin) + '/api',

  SERVER_URL: window.location.origin.includes('admin.')
    ? window.location.origin.replace('admin.', 'api.')
    : window.location.origin,

  CLIENT_URL: window.location.origin.includes('admin.')
    ? window.location.origin.replace('admin.', '')
    : window.location.origin
};

