import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
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
    setToken(token);
    setUser(user);
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send the Firebase ID token to our backend to get our own JWT and user data
      const res = await api.post('/auth/google', { idToken });
      
      const { token: jwtToken, user: userData } = res.data;
      login(jwtToken, userData);
      
      return res; // To allow caller to handle navigation
    } catch (err) {
      console.error("Google authentication error:", err);
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
      user, token, login, loginWithGoogle, logout, loading,
      onboardingCompleted, completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);