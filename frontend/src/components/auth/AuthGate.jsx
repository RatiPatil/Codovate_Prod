import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function AuthGate({ children, requireAuth = true }) {

  const [state, setState] = useState({
    loading: true,
    user: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!mounted) return;

        setState({
          loading: false,
          user: user || null,
          error: null,
        });
      },
      (error) => {
        if (!mounted) return;

        console.error('Firebase Auth state error:', error);

        setState({
          loading: false,
          user: null,
          error,
        });
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-slate-500">
          Checking authentication...
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Authentication unavailable
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {state.error?.message || 'Unable to initialize authentication.'}
          </p>
        </div>
      </div>
    );
  }

  if (requireAuth && !state.user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}
