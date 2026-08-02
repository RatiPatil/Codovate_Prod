import axios from 'axios';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return url.replace(/([a-zA-Z0-9]+)_([a-zA-Z0-9-]+\.onrender\.com)/g, '$1-$2');
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 10) || 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect if we are not already on an auth page, and the endpoint wasn't an auth endpoint
    const isAuthRoute = err.config?.url?.includes('/auth/');
    
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.localStorage.setItem('logoutEvent', Date.now());
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin-login') {
        window.location.href = '/login';
      }
    } else if (err.response?.status === 403) {
      console.warn('[Axios] 403 Forbidden:', err.response?.data?.message || 'Access Denied');
      // If they get a 403 on an initial load, we might want to redirect them
      // For API calls, they can be handled locally by the component.
    }
    return Promise.reject(err);
  }
);

export default api;