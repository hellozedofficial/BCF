/**
 * Bangladesh Carrom Federation (BCF)
 * Admin Panel Runtime Configuration
 *
 * Customize API & Server URLs here without rebuilding React/Vite.
 */
const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

window.__BCF_CONFIG__ = {
  // Backend API URL - Same-origin Nginx reverse proxy in production
  API_URL: isLocal ? 'http://localhost:5050/api' : (window.location.origin + '/api'),

  // Backend Server Root URL (for uploaded media /uploads/...)
  SERVER_URL: isLocal ? 'http://localhost:5050' : window.location.origin,

  // Official Client Website URL
  CLIENT_URL: isLocal ? 'http://localhost:5173' : (window.location.protocol + '//bcf.org.bd')
};


