import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
});

async function resolveToken() {
  try {
    const firebase = await import('./firebase');
    const auth =
      firebase.auth ||
      firebase.default?.auth ||
      firebase.default;

    const user = auth?.currentUser;

    if (!user) return null;

    return await user.getIdToken();
  } catch {
    return null;
  }
}

api.interceptors.request.use(async config => {
  const token = await resolveToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;

    if (status === 401) {
      window.dispatchEvent(
        new CustomEvent('codovate:auth-required')
      );
    }

    if (status === 403) {
      window.dispatchEvent(
        new CustomEvent('codovate:access-denied')
      );
    }

    return Promise.reject(error);
  }
);

export async function get(url, config) {
  const response = await api.get(url, config);
  return response.data;
}

export async function post(url, data, config) {
  const response = await api.post(url, data, config);
  return response.data;
}

export async function put(url, data, config) {
  const response = await api.put(url, data, config);
  return response.data;
}

export async function del(url, config) {
  const response = await api.delete(url, config);
  return response.data;
}

export function normalizeError(error) {
  return {
    status: error?.response?.status || 0,
    code:
      error?.response?.data?.code ||
      error?.code ||
      'UNKNOWN_ERROR',
    message:
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.',
  };
}

export default api;
