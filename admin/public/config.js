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
  // Backend API URL - Point to main domain API
  API_URL: isLocal ? 'http://localhost:5050/api' : 'https://bcf.org.bd/api',

  // Backend Server Root URL (for uploaded media /uploads/...)
  SERVER_URL: isLocal ? 'http://localhost:5050' : 'https://bcf.org.bd',

  // Official Client Website URL
  CLIENT_URL: isLocal ? 'http://localhost:5173' : 'https://bcf.org.bd'
};


