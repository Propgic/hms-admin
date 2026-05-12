import axios from 'axios';
import toast from 'react-hot-toast';

const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
// Strip the /api/v1 suffix when present so we can hit /auth/refresh-token on
// the same origin without double-prefixing. baseURL keeps /api/v1.
const API_ORIGIN = RAW_BASE.replace(/\/api\/v\d+\/?$/, '');

const api = axios.create({
  baseURL: RAW_BASE,
  // Required so the httpOnly refreshToken cookie set by the backend gets
  // sent along with our requests (especially POST /platform/auth/refresh-token).
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single in-flight refresh promise — see comments in hms/src/api/axios.js
// for the rationale (avoids N concurrent refresh calls on N stale-token
// requests that race each other after token expiry).
let refreshPromise = null;

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_ORIGIN}/api/v1/platform/auth/refresh-token`, {}, { withCredentials: true })
      .then((r) => {
        const newToken = r.data?.data?.accessToken;
        if (newToken) localStorage.setItem('hms_admin_token', newToken);
        return newToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// Centralizes the "your session is over, go to login" flow so every code
// path leads to the same place. Idempotent — calling it twice in the same
// tick is safe; only the first one navigates.
let loggingOut = false;
export function forceLogout(reason = 'Session expired. Please login again.') {
  if (loggingOut) return;
  loggingOut = true;
  try {
    localStorage.removeItem('hms_admin_token');
    localStorage.removeItem('hms_admin_user');
  } catch (_) { /* private mode etc. */ }
  if (window.location.pathname !== '/login') {
    if (reason) toast.error(reason);
    window.location.replace('/login');
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;
    const url = original?.url || '';
    // /auth/me used to be in this list, but excluding it meant a page reload
    // after the access-token expired bounced to /login even though the
    // refresh-cookie was still valid. /me now refreshes-and-retries like any
    // other call; the `_retried` guard below still prevents loops.
    const isAuthEndpoint = /\/auth\/(login|forgot-password|reset-password|refresh-token)/.test(url);

    if (status === 401 && !isAuthEndpoint && !original._retried) {
      try {
        original._retried = true;
        const newToken = await tryRefresh();
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (_) { /* fall through to forceLogout */ }
    }

    if (status === 401 && !isAuthEndpoint) {
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
