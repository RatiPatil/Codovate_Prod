import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, getRedirectResult, signInWithCustomToken } from 'firebase/auth';
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

function getAuthData() {
  // Check localStorage first (rememberMe), then sessionStorage
  const lsToken = localStorage.getItem('token');
  const lsUser = localStorage.getItem('user');
  if (lsToken && lsUser) return { token: lsToken, user: JSON.parse(lsUser) };

  const ssToken = sessionStorage.getItem('token');
  const ssUser = sessionStorage.getItem('user');
  if (ssToken && ssUser) return { token: ssToken, user: JSON.parse(ssUser) };

  return { token: null, user: null };
}

function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('onboarding_completed');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
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
        console.error("Firebase Redirect Auth Error:", err);
      }
    };
    checkRedirect();
  }, []);

  // ─── Verify onboarding from DB when token is available ─
  useEffect(() => {
    if (!token) return;
    api.get('/onboarding/status')
      .then(res => {
        const completed = res.data.onboarding_completed === true;
        setOnboardingCompleted(completed);
        getStorage().setItem('onboarding_completed', completed);
      })
      .catch(() => setOnboardingCompleted(false));
  }, [token]);

  // ─── Login ─────────────────────────────────────────────
  const login = useCallback((newToken, newUser, rememberMe = true) => {
    setAuthData(newToken, newUser, rememberMe);
    setToken(newToken);
    setUser(newUser);
    setOnboardingCompleted(null); // Reset to trigger fresh check
  }, []);

  // ─── Google Login ──────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result) {
        const idToken = await result.user.getIdToken();
        const res = await api.post('/auth/google', { idToken });
        const { token: jwtToken, user: userData } = res.data;
        login(jwtToken, userData, true);
      }
    } catch (err) {
      console.error("Google authentication error:", err);
      // Ensure we clear the Firebase session if our backend rejects the login
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
      const { linkWithPopup } = await import('firebase/auth');
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