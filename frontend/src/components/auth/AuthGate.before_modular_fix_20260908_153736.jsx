import { useEffect, useState } from 'react';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

export default function AuthGate({ children }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
    error: null,
  });

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    async function init() {
      try {
        const firebase = await import('../../lib/firebase');

        const auth =
          firebase.auth ||
          firebase.default?.auth ||
          firebase.default;

        const onAuth =
          firebase.onAuthStateChanged ||
          firebase.default?.onAuthStateChanged;

        if (!auth || typeof onAuth !== 'function') {
          throw new Error(
            'Firebase Auth is not configured in the frontend.'
          );
        }

        unsubscribe = onAuth(auth, user => {
          if (!mounted) return;

          setState({
            loading: false,
            user: user || null,
            error: null,
          });
        });
      } catch (error) {
        if (!mounted) return;

        setState({
          loading: false,
          user: null,
          error:
            error?.message ||
            'Unable to initialize authentication.',
        });
      }
    }

    init();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (state.loading) {
    return <LoadingState label="Checking your session..." />;
  }

  if (state.error) {
    return (
      <ErrorState
        title="Authentication unavailable"
        description={state.error}
      />
    );
  }

  if (!state.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2015ff] font-black text-white">
            C
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Welcome to Codovate
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please sign in to access your career workspace.
          </p>

          <a
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-[#2015ff] px-5 py-3 text-sm font-semibold text-white"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return children;
}
