import axios from 'axios';
import { getAuth } from 'firebase/auth';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || '/api';
  return url.replace(/([a-zA-Z0-9]+)_([a-zA-Z0-9-]+\.onrender\.com)/g, '$1-$2');
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 10) || 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Firebase-UID'] = user.uid;
    }
  } catch (error) {
    console.error('[Axios] Firebase token resolution failed:', error);
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect if we are not already on an auth page, and the endpoint wasn't an auth endpoint
    const isAuthRoute = err.config?.url?.includes('/auth/');
    
    if (err.response?.status === 401 && !isAuthRoute) {
        window.dispatchEvent(new CustomEvent('codovate:auth-required'));
      } else if (err.response?.status === 403) {
      console.warn('[Axios] 403 Forbidden:', err.response?.data?.message || 'Access Denied');
      // If they get a 403 on an initial load, we might want to redirect them
      // For API calls, they can be handled locally by the component.
    }
    return Promise.reject(err);
  }
);

export default api;