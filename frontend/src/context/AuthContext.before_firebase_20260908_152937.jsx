import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, linkWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import api from '../api/axios';

const defaultAuthContext = {
  user: null,
  token: null,
  loading: true,
  initialized: false,
  updateUser: () => {},
  login: () => {},
  logout: () => {},
  loginWithGoogle: () => {},
  linkGoogleAccount: () => {}
};

const AuthContext = createContext(defaultAuthContext);

function setAuthData(token, user, rememberMe = true) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  if (rememberMe) {
    localStorage.setItem('rememberMe', 'true');
  } else {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now() + 5 * 60 * 1000) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function getAuthData() {
  const lsToken = localStorage.getItem('token');
  const lsUser = localStorage.getItem('user');
  
  if (lsToken && lsUser) {
    if (isTokenValid(lsToken)) {
      return { token: lsToken, user: JSON.parse(lsUser) };
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
    }
  }

  const ssToken = sessionStorage.getItem('token');
  const ssUser = sessionStorage.getItem('user');
  
  if (ssToken && ssUser) {
    if (isTokenValid(ssToken)) {
      return { token: ssToken, user: JSON.parse(ssUser) };
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  }

  return { token: null, user: null };
}

function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('onboarding_completed');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('onboarding_completed');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initial load: restore session
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { token: savedToken, user: savedUser } = getAuthData();

      if (savedToken && savedUser && isMounted) {
        setToken(savedToken);
        setUser(savedUser);
      }

      if (isMounted) {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    return () => { isMounted = false; };
  }, []);

  // Handle Google Redirect Result
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken();
          const res = await api.post('/auth/google', { idToken });
          const { token: jwtToken, user: userData } = res.data;
          login(jwtToken, userData, true);
        }
      } catch (err) {
        console.warn("Firebase Redirect Auth Error:", err);
      }
    };
    checkRedirect();
  }, []);

  // Login
  const login = useCallback((newToken, newUser, rememberMe = true) => {
    setAuthData(newToken, newUser, rememberMe);
    setToken(newToken);
    setUser(newUser);
  }, []);

  // Google Login
  const loginWithGoogle = useCallback(async () => {
    try {
      let result = null;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr) {
        console.warn("Popup error, attempting redirect fallback:", popupErr);
        if (
          popupErr.code === 'auth/popup-blocked' ||
          popupErr.code === 'auth/popup-closed-by-user' ||
          popupErr.code === 'auth/cancelled-popup-request' ||
          (popupErr.message && popupErr.message.includes('Cross-Origin-Opener-Policy'))
        ) {
          await signInWithRedirect(auth, googleProvider);
          return null;
        }
        throw popupErr;
      }

      if (result) {
        const idToken = await result.user.getIdToken();
        const res = await api.post('/auth/google', { idToken });

        const { token: jwtToken, user: userData } = res.data;
        login(jwtToken, userData, true);

        return { token: jwtToken, user: userData };
      }
    } catch (err) {
      console.error("Google authentication error:", err);
      try { await auth.signOut(); } catch(e) {}
      throw err;
    }
  }, [login]);

  // Link Google Account
  const linkGoogleAccount = useCallback(async () => {
    try {
      if (!auth.currentUser) throw new Error("No active Firebase session.");
      const result = await linkWithPopup(auth.currentUser, googleProvider);

      try {
        await api.post('/auth/sync-providers', {
          providers: result.user.providerData.map(p => p.providerId.replace('.com', ''))
        });
      } catch (e) {
        console.warn("Could not sync providers to backend", e);
      }
      return result;
    } catch (err) {
      console.error("Link account error:", err);
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try { await auth.signOut(); } catch (e) {}
    clearAuthData();
    setToken(null);
    setUser(null);
  }, []);

  // Update User Profile State
  const updateUser = useCallback((updatedFields) => {
    setUser(prev => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...updatedFields };
      const isRemember = localStorage.getItem('rememberMe') === 'true';
      const storage = isRemember ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, login, loginWithGoogle, linkGoogleAccount, logout, loading, initialized, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) || defaultAuthContext;