import { getAuth } from 'firebase/auth';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
});

/*
 * Codovate Firebase ID-token bridge.
 * The token is resolved immediately before every API request.
 * This avoids the race where Firebase Auth has rendered the UI
 * but currentUser has not yet been initialized for the request.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();

      let user = auth.currentUser;

      if (!user) {
        await new Promise((resolve) => {
          const unsubscribe = auth.onIdTokenChanged
            ? auth.onIdTokenChanged(
                (currentUser) => {
                  user = currentUser;
                  unsubscribe();
                  resolve();
                },
                () => {
                  unsubscribe();
                  resolve();
                }
              )
            : null;

          if (!unsubscribe) {
            resolve();
          }
        });
      }

      if (user) {
        const token = await user.getIdToken(true);

        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        config.headers["X-Firebase-UID"] = user.uid;
      } else {
        console.warn("[Codovate API] Firebase user unavailable for request:", config.url);
      }
    } catch (error) {
      console.error("[Codovate API] Firebase token error:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);





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
