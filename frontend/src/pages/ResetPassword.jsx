import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useToast } from '../components/ui/ToastProvider';
import AuthInput from '../components/auth/AuthInput';
import AuthLayout from '../components/auth/AuthLayout';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import Logo from '../components/common/Logo';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, CheckCircle2, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const { addToast } = useToast();
  const navigate = useNavigate();

  // Get action code (oobCode) from query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const oobCode = queryParams.get('oobCode');

  useEffect(() => {
    document.title = 'Create New Password | Codovate';
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { y: 20, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!oobCode) {
      setError('Invalid or expired password reset link. Please request a new link.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been updated successfully.',
      });
    } catch (err) {
      console.error(err);
      let msg = 'Something went wrong. Please request a new password reset link.';
      if (err.code === 'auth/expired-action-code') msg = 'This password reset link has expired. Please request a new link.';
      else if (err.code === 'auth/invalid-action-code') msg = 'Invalid or already used reset link. Please request a new link.';
      else if (err.code === 'auth/weak-password') msg = 'Password is too weak. Please use at least 6 characters.';

      setError(msg);
      addToast({ type: 'error', title: 'Update Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const brandPanel = (
    <AuthBrandPanel
      badge="Account Credentials"
      title="Create Your New Codovate Password."
      subtitle="Choose a strong password to protect your projects, learning tracks, and career opportunities."
      benefits={[
        {
          icon: KeyRound,
          title: 'Strong Password Policy',
          desc: 'Minimum 6 characters with encryption',
        },
        {
          icon: ShieldCheck,
          title: 'Secure Account Recovery',
          desc: 'Instant updates to your Firebase credentials',
        },
      ]}
    />
  );

  return (
    <AuthLayout brandPanel={brandPanel}>
      {/* Mobile Top Logo */}
      <div className="lg:hidden w-full max-w-md mb-6 flex justify-start">
        <Link to="/">
          <Logo size="xs" responsive />
        </Link>
      </div>

      {/* Main Auth Surface Card */}
      <div
        ref={cardRef}
        className="w-full max-w-md bg-white/95 dark:bg-[#111522]/95 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-7 sm:p-9 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-6 relative overflow-hidden transition-colors"
      >
        {/* Card Header */}
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your new password below to update your Codovate account credentials.
            </p>
          </div>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn"
            role="alert"
          >
            <span className="text-base shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Card State */}
        {success ? (
          <div className="space-y-5 text-center py-2 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-slate-900 dark:text-white font-extrabold text-lg">
                Password Updated Successfully
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Your password has been reset. You can now continue to sign in with your new password.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md block text-center hover:opacity-95 transition-opacity"
            >
              Continue to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AuthInput
              id="reset-new-password"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              icon={Lock}
            />

            <AuthInput
              id="reset-confirm-password"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              error={confirmPassword !== '' && newPassword !== confirmPassword ? 'Passwords do not match' : null}
              disabled={loading}
              icon={Lock}
            />

            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-3.5 px-6 rounded-xl
                bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                hover:opacity-95 text-white text-xs sm:text-sm font-bold
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35
                hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                transition-all duration-200 flex items-center justify-center gap-2 mt-2
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </span>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        {/* Card Footer Link */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
