import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, getRedirectResult, signInWithCustomToken } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedOnboarding = localStorage.getItem('onboarding_completed');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Use cached onboarding status first
      if (savedOnboarding !== null) {
        setOnboardingCompleted(savedOnboarding === 'true');
      }
    }
    setLoading(false);
  }, []);

  // Handle Google Login Redirect Result
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken();
          const res = await api.post('/auth/google', { idToken });
          const { token: jwtToken, user: userData } = res.data;
          login(jwtToken, userData);
        }
      } catch (err) {
        console.error("Firebase Redirect Auth Error:", err);
      }
    };
    checkRedirect();
  }, []);

  // Verify onboarding from DB when token is available
  useEffect(() => {
    if (!token) return;
    api.get('/onboarding/status')
      .then(res => {
        const completed = res.data.onboarding_completed === true;
        setOnboardingCompleted(completed);
        localStorage.setItem('onboarding_completed', completed);
      })
      .catch(() => setOnboardingCompleted(false));
  }, [token]);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('onboarding_completed'); // Force fresh check
    setToken(token);
    setUser(user);
    setOnboardingCompleted(null); // Reset state to trigger Spinner
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result) {
        const idToken = await result.user.getIdToken();
        const res = await api.post('/auth/google', { idToken });
        const { token: jwtToken, user: userData } = res.data;
        login(jwtToken, userData);
      }
    } catch (err) {
      console.error("Google authentication error:", err);
      // Ensure we clear the Firebase session if our backend rejects the login
      try { await auth.signOut(); } catch(e) {}
      throw err;
    }
  };

  const loginWithPhone = async (idToken) => {
    try {
      const res = await api.post('/auth/phone', { idToken });
      
      if (res.data.action === "MERGED") {
        await auth.signOut();
        await signInWithCustomToken(auth, res.data.customToken);
      }

      const { token: jwtToken, user: userData } = res.data;
      login(jwtToken, userData);
    } catch (err) {
      console.error("Phone authentication error:", err);
      try { await auth.signOut(); } catch(e) {}
      throw err;
    }
  };

  const linkGoogleAccount = async () => {
    try {
      if (!auth.currentUser) throw new Error("No active Firebase session.");
      // Dynamically import linkWithPopup
      const { linkWithPopup } = await import('firebase/auth');
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      
      // Update backend to record the new provider (optional sync step)
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('onboarding_completed');
    setToken(null);
    setUser(null);
    setOnboardingCompleted(null);
  };

  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    localStorage.setItem('onboarding_completed', 'true');
  };

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