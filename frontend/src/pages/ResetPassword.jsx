import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useToast } from '../components/ui/ToastProvider';
import AuthInput from '../components/auth/AuthInput';
import AuthLayout from '../components/auth/AuthLayout';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import Logo from '../components/common/Logo';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const { addToast } = useToast();

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
          { y: 15, opacity: 0, scale: 0.99 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }
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
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!oobCode) {
      setError('Invalid or expired reset link. Please request a new link.');
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
      let msg = 'Something went wrong. Please request a new reset link.';
      if (err.code === 'auth/expired-action-code') msg = 'This reset link has expired. Please request a new link.';
      else if (err.code === 'auth/invalid-action-code') msg = 'Invalid reset link. Please request a new link.';

      setError(msg);
      addToast({ type: 'error', title: 'Update Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const brandPanel = (
    <AuthBrandPanel
      title="Reset password"
      subtitle="Create your new password."
    />
  );

  return (
    <AuthLayout brandPanel={brandPanel}>
      {/* Mobile Top Logo */}
      <div className="lg:hidden w-full max-w-sm mb-4 flex justify-start">
        <Link to="/">
          <Logo size="xs" responsive />
        </Link>
      </div>

      {/* Main Lightweight Auth Surface Card */}
      <div
        ref={cardRef}
        className="w-full max-w-sm bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-5 transition-colors"
      >
        {/* Card Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create new password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            Enter your new password below.
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2 animate-fadeIn"
            role="alert"
          >
            <span className="text-sm shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="space-y-4 py-1 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Password updated</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your password has been reset. You can now sign in with your new password.
            </p>

            <Link
              to="/login"
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-sm block text-center hover:opacity-95 transition-opacity"
            >
              Continue to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
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
              label="Confirm Password"
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
                w-full py-3 px-5 rounded-xl
                bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                hover:opacity-95 text-white text-xs sm:text-sm font-bold
                shadow-sm hover:shadow-md
                hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                transition-all duration-200 flex items-center justify-center gap-2 mt-1
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Updating...</span>
                </span>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        {/* Card Footer Link */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
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
