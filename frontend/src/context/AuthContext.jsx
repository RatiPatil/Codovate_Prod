import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCustomToken, linkWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import api from '../api/axios';

const AuthContext = createContext();

// ─── Storage helpers for Remember Me ────────────────────
function getStorage() {
  // If rememberMe was set, use localStorage (persistent); otherwise sessionStorage
  return localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
}

function setAuthData(token, user, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  if (rememberMe) {
    localStorage.setItem('rememberMe', 'true');
  } else {
    localStorage.removeItem('rememberMe');
    // Also clear from localStorage if switching
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// ─── JWT Expiry Validation ────────────────────────────────
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if exp exists and is in the future (giving 5 min buffer)
    if (payload.exp && payload.exp * 1000 < Date.now() + 5 * 60 * 1000) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function getAuthData() {
  // Check localStorage first (rememberMe), then sessionStorage
  const lsToken = localStorage.getItem('token');
  const lsUser = localStorage.getItem('user');
  
  if (lsToken && lsUser) {
    if (isTokenValid(lsToken)) {
      return { token: lsToken, user: JSON.parse(lsUser) };
    } else {
      // Clear expired local session
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
      // Clear expired session storage
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
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Initial load: restore session ─────────────────────
  useEffect(() => {
    const { token: savedToken, user: savedUser } = getAuthData();
    const savedOnboarding = localStorage.getItem('onboarding_completed') || sessionStorage.getItem('onboarding_completed');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      if (savedOnboarding !== null) {
        setOnboardingCompleted(savedOnboarding === 'true');
      }
    }
    setLoading(false);
  }, []);

  // ─── Handle Google Redirect Result ─────────────────────
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken();
          const res = await api.post('/auth/google', { idToken });
          const { token: jwtToken, user: userData } = res.data;
          login(jwtToken, userData, true); // Redirect → default to rememberMe
        }
      } catch (err) {
        console.warn("Firebase Redirect Auth Error:", err);
      }
    };
    checkRedirect();
  }, []);

  // ─── Verify onboarding from DB only if status is unknown ─
  useEffect(() => {
    if (!token || onboardingCompleted !== null) return;
    api.get('/onboarding/status')
      .then(res => {
        const completed = res.data.onboarding_completed === true || res.data.onboarding_completed === "true";
        setOnboardingCompleted(completed);
        getStorage().setItem('onboarding_completed', String(completed));
      })
      .catch(() => setOnboardingCompleted(false));
  }, [token, onboardingCompleted]);

  // ─── Login ─────────────────────────────────────────────
  const login = useCallback((newToken, newUser, rememberMe = true) => {
    setAuthData(newToken, newUser, rememberMe);
    setToken(newToken);
    setUser(newUser);
    const obCompleted = newUser?.onboardingCompleted ?? (newUser?.role !== 'student');
    setOnboardingCompleted(obCompleted);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('onboarding_completed', String(obCompleted));
  }, []);

  // ─── Google Login ──────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      const tFbStart = performance.now();
      let result = null;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr) {
        console.warn("Popup error/COOP restriction, attempting redirect fallback:", popupErr);
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

      const tFbEnd = performance.now();

      if (result) {
        const idToken = await result.user.getIdToken();
        const tBackendStart = performance.now();
        const res = await api.post('/auth/google', { idToken });
        const tBackendEnd = performance.now();

        const { token: jwtToken, user: userData, redirect } = res.data;
        login(jwtToken, userData, true);

        console.log(
          `[AUTH TIMINGS] Firebase Popup: ${(tFbEnd - tFbStart).toFixed(0)}ms | Backend Google API: ${(tBackendEnd - tBackendStart).toFixed(0)}ms`
        );
        return { token: jwtToken, user: userData, redirect };
      }
    } catch (err) {
      console.error("Google authentication error:", err);
      try { await auth.signOut(); } catch(e) {}
      throw err;
    }
  }, [login]);

  // ─── Phone Login (preserved for backward compatibility) ─
  const loginWithPhone = useCallback(async (idToken) => {
    try {
      const res = await api.post('/auth/phone', { idToken });

      if (res.data.action === "MERGED") {
        await auth.signOut();
        await signInWithCustomToken(auth, res.data.customToken);
      }

      const { token: jwtToken, user: userData } = res.data;
      login(jwtToken, userData, true);
    } catch (err) {
      console.error("Phone authentication error:", err);
      try { await auth.signOut(); } catch(e) {}
      throw err;
    }
  }, [login]);

  // ─── Link Google Account ───────────────────────────────
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

  // ─── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await auth.signOut(); } catch (e) {}
    clearAuthData();
    setToken(null);
    setUser(null);
    setOnboardingCompleted(null);
  }, []);

  // ─── Complete Onboarding ───────────────────────────────
  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    getStorage().setItem('onboarding_completed', 'true');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, login, loginWithGoogle, loginWithPhone, linkGoogleAccount, logout, loading,
      onboardingCompleted, completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);