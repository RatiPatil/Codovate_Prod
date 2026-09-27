import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  linkWithPopup,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import api from '../api/axios';

const AuthContext = createContext(null);

const defaultAuthContext = {
  user: null,
  token: null,
  loading: true,
  initialized: false,
  login: () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => {},
  linkGoogleAccount: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  completeOnboarding: () => {},
};

const normalizeFirebaseUser = (firebaseUser, extra = {}) => {
  if (!firebaseUser) return null;

  let storedUser = {};
  try {
    const raw = localStorage.getItem('user');
    if (raw) storedUser = JSON.parse(raw);
  } catch (_) {}

  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    firebase_uid: firebaseUser.uid,
    email: firebaseUser.email || storedUser.email || null,
    phone: firebaseUser.phoneNumber || storedUser.phone || null,
    full_name: firebaseUser.displayName || storedUser.name || null,
    name: firebaseUser.displayName || storedUser.name || null,
    displayName: firebaseUser.displayName || storedUser.name || null,
    avatar_url: firebaseUser.photoURL || storedUser.avatar || null,
    photoURL: firebaseUser.photoURL || storedUser.avatar || null,
    role: extra.role || storedUser.role || 'student',
    onboardingCompleted: extra.onboardingCompleted ?? storedUser.onboardingCompleted ?? false,
    profileCompletion: extra.profileCompletion ?? storedUser.profileCompletion ?? 0,
    email_verified: !!firebaseUser.emailVerified,
    phone_verified: !!firebaseUser.phoneNumber,
    providers: (firebaseUser.providerData || []).map(
      (provider) => provider.providerId
    ),
  };
};

const getFreshToken = async (firebaseUser) => {
  if (!firebaseUser) return null;
  return firebaseUser.getIdToken(true);
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const syncFirebaseSession = useCallback(async (nextFirebaseUser) => {
    setFirebaseUser(nextFirebaseUser || null);

    if (!nextFirebaseUser) {
      setToken(null);
      return null;
    }

    const nextToken = await getFreshToken(nextFirebaseUser);
    setToken(nextToken);

    // Read custom claims (e.g. role) from the Firebase token
    let extra = {};
    try {
      const idTokenResult = await nextFirebaseUser.getIdTokenResult();
      if (idTokenResult.claims?.role) {
        extra.role = idTokenResult.claims.role;
      }
    } catch (_) {}

    const normalizedUser = normalizeFirebaseUser(nextFirebaseUser, extra);

    return {
      firebaseUser: nextFirebaseUser,
      token: nextToken,
      user: normalizedUser,
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (nextFirebaseUser) => {
        if (!mounted) return;

        try {
          await syncFirebaseSession(nextFirebaseUser);
        } catch (error) {
          console.error('[Codovate Auth] Session sync failed:', error);
          if (mounted) {
            setFirebaseUser(null);
            setToken(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
        }
      },
      (error) => {
        console.error('[Codovate Auth] Firebase state error:', error);

        if (mounted) {
          setFirebaseUser(null);
          setToken(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [syncFirebaseSession]);

  useEffect(() => {
    let mounted = true;

    const resolveRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result?.user && mounted) {
          await syncFirebaseSession(result.user);
        }
      } catch (error) {
        console.error('[Codovate Auth] Redirect login failed:', error);
      }
    };

    resolveRedirect();

    return () => {
      mounted = false;
    };
  }, [syncFirebaseSession]);

  const login = useCallback((nextToken, nextUser) => {
    setToken(nextToken || null);
    setFirebaseUser(auth.currentUser || null);

    if (nextUser) {
      try {
        localStorage.setItem('user', JSON.stringify(nextUser));
      } catch (_) {}
    }
  }, []);

  const registerWithEmail = useCallback(async (email, password, fullName) => {
    if (!email?.trim() || !password) {
      throw new Error('Email and password are required.');
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (fullName?.trim()) {
        await updateProfile(result.user, {
          displayName: fullName.trim(),
        });
      }

      const nextToken = await result.user.getIdToken(true);
      setToken(nextToken);

      // Initialize canonical Firestore record and assign student role
      let backendUser = null;
      try {
        const res = await api.post('/auth/register-sync', {
          idToken: nextToken,
          name: fullName?.trim() || 'Student',
        });
        if (res.data?.user) {
          backendUser = res.data.user;
          localStorage.setItem('user', JSON.stringify(backendUser));
        }
      } catch (syncErr) {
        console.warn('[Codovate Auth] Backend register-sync notice:', syncErr.message);
      }

      const session = await syncFirebaseSession(result.user);
      if (session?.user && backendUser) {
        session.user.role = backendUser.role || 'student';
        session.user.onboardingCompleted = false;
      }

      return session;
    } catch (error) {
      console.error('[Codovate Auth] Registration failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw error;
    }
  }, [syncFirebaseSession]);

  const loginWithEmail = useCallback(async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error('Email and password are required.');
    }

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const session = await syncFirebaseSession(result.user);

      // Fetch fresh profile state from backend
      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
          if (session?.user) {
            session.user.role = res.data.role || session.user.role;
            session.user.onboardingCompleted = res.data.onboardingCompleted;
          }
        }
      } catch (_) {}

      return session;
    } catch (error) {
      console.error('[Codovate Auth] Email login failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw error;
    }
  }, [syncFirebaseSession]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const session = await syncFirebaseSession(result.user);

      // Exchange with backend to establish canonical Firestore record
      try {
        const idToken = await result.user.getIdToken();
        const res = await api.post('/auth/google', { idToken });
        if (res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          if (session?.user) {
            session.user.role = res.data.user.role || 'student';
            session.user.onboardingCompleted = res.data.user.onboardingCompleted;
          }
        }
      } catch (err) {
        console.warn('[Codovate Auth] Backend Google sync notice:', err.message);
      }

      return session;
    } catch (error) {
      console.error('[Codovate Auth] Google popup failed:', {
        code: error?.code,
        message: error?.message,
      });

      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('Cross-Origin-Opener-Policy')
      ) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      throw error;
    }
  }, [syncFirebaseSession]);

  const linkGoogleAccount = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('You must be signed in before linking Google.');
    }

    const result = await linkWithPopup(auth.currentUser, googleProvider);
    return syncFirebaseSession(result.user);
  }, [syncFirebaseSession]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } finally {
      setFirebaseUser(null);
      setToken(null);

      try {
        localStorage.removeItem('user');
        localStorage.removeItem('codovate_onboarding');
        sessionStorage.removeItem('user');
      } catch (_) {}
    }
  }, []);

  const completeOnboarding = useCallback((status = true) => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.onboardingCompleted = status;
      localStorage.setItem('user', JSON.stringify(parsed));
    } catch (_) {}

    setFirebaseUser(prev => (prev ? { ...prev } : null));
  }, []);

  const updateUser = useCallback(
    async (updates = {}) => {
      if (!auth.currentUser) {
        throw new Error('No authenticated Firebase user.');
      }

      const displayName =
        updates.displayName ??
        updates.full_name ??
        auth.currentUser.displayName;

      const photoURL =
        updates.photoURL ??
        updates.avatar_url ??
        auth.currentUser.photoURL;

      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });

      return syncFirebaseSession(auth.currentUser);
    },
    [syncFirebaseSession]
  );

  const value = useMemo(
    () => ({
      user: normalizeFirebaseUser(firebaseUser),
      token,
      loading,
      initialized,
      login,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      linkGoogleAccount,
      logout,
      updateUser,
      completeOnboarding,
    }),
    [
      firebaseUser,
      token,
      loading,
      initialized,
      login,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      linkGoogleAccount,
      logout,
      updateUser,
      completeOnboarding,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext) || defaultAuthContext;

export default AuthContext;
