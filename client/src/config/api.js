export const getApiBaseUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.__BCF_CONFIG__?.API_URL) {
      return window.__BCF_CONFIG__.API_URL;
    }
    if (typeof __APP_API_URL__ !== 'undefined' && __APP_API_URL__) {
      return __APP_API_URL__;
    }
  } catch (e) {}
  return (
    import.meta.env.VITE_API_URL ||
    import.meta.env.API_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:5050/api')
  );
};

export const getServerBaseUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.__BCF_CONFIG__?.SERVER_URL !== undefined) {
      return window.__BCF_CONFIG__.SERVER_URL;
    }
    if (typeof __APP_SERVER_URL__ !== 'undefined' && __APP_SERVER_URL__) {
      return __APP_SERVER_URL__;
    }
  } catch (e) {}
  return (
    import.meta.env.VITE_SERVER_URL ||
    import.meta.env.SERVER_URL ||
    (import.meta.env.PROD ? '' : 'http://localhost:5050')
  );
};

export const API_BASE = getApiBaseUrl();
export const SERVER_BASE = getServerBaseUrl();

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `${SERVER_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

