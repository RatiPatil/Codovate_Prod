import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
});

async function getFirebaseToken() {
  try {
    const mod = await import('../lib/firebase');
    const auth = mod.auth || mod.default?.auth;

    if (auth?.currentUser) {
      return await auth.currentUser.getIdToken();
    }

    return null;
  } catch {
    return null;
  }
}

api.interceptors.request.use(async config => {
  const token = await getFirebaseToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const apiGet = (url, params) =>
  api.get(url, { params }).then(r => r.data);

export const apiPost = (url, data) =>
  api.post(url, data).then(r => r.data);

export const apiPut = (url, data) =>
  api.put(url, data).then(r => r.data);

export const apiDelete = url =>
  api.delete(url).then(r => r.data);

export default api;
