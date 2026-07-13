import axios from 'axios';

const apiV1 = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/v1',
});

apiV1.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiV1.interceptors.response.use(
  (res) => {
    // Automatically unwrap the standard { success, data, message } wrapper
    if (res.data && res.data.success) {
      return res.data.data;
    }
    return res.data;
  },
  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/');
    
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin-login') {
        window.location.href = '/login';
      }
    }

    // Pass the standard error message forward if it exists
    if (err.response && err.response.data && !err.response.data.success) {
      return Promise.reject(new Error(err.response.data.message || 'API Error'));
    }
    
    return Promise.reject(err);
  }
);

export default apiV1;
