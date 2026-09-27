import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
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

const AuthContext = createContext(null);

const defaultAuthContext = {
  user: null,
  token: null,
  loading: true,
  initialized: false,
  login: () => {},
  loginWithEmail: async () => {},
  loginWithGoogle: async () => {},
  linkGoogleAccount: async () => {},
  logout: async () => {},
  updateUser: async () => {},
};

const normalizeFirebaseUser = (firebaseUser) => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    firebase_uid: firebaseUser.uid,
    email: firebaseUser.email || null,
    phone: firebaseUser.phoneNumber || null,
    full_name: firebaseUser.displayName || null,
    displayName: firebaseUser.displayName || null,
    avatar_url: firebaseUser.photoURL || null,
    photoURL: firebaseUser.photoURL || null,
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

    return {
      firebaseUser: nextFirebaseUser,
      token: nextToken,
      user: normalizeFirebaseUser(nextFirebaseUser),
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
      return syncFirebaseSession(result.user);
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
        sessionStorage.removeItem('user');
      } catch (_) {}
    }
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
      loginWithGoogle,
      linkGoogleAccount,
      logout,
      updateUser,
    }),
    [
      firebaseUser,
      token,
      loading,
      initialized,
      login,
      loginWithEmail,
      loginWithGoogle,
      linkGoogleAccount,
      logout,
      updateUser,
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
