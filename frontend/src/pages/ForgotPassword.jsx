import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useToast } from '../components/ui/ToastProvider';
import { validateEmail } from '../utils/validators';
import AuthInput from '../components/auth/AuthInput';
import AuthLayout from '../components/auth/AuthLayout';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import Logo from '../components/common/Logo';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const cardRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Reset Password | Codovate';
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

  const emailError = touched ? validateEmail(email) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validateEmail(email);
    if (err) return;

    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);

      if (methods.includes('google.com')) {
        setError('This account uses Google Sign-In. Please sign in with Google.');
        setLoading(false);
        return;
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, normalizedEmail, actionCodeSettings);
      setSuccess(true);
      addToast({
        type: 'success',
        title: 'Email Sent',
        message: 'Password reset link sent to your email.',
      });
    } catch (err) {
      console.error(err);
      let msg = 'Something went wrong. Please try again.';
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email address.';
      else if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      else if (err.code === 'auth/network-request-failed') msg = 'Network error. Please check your connection.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many requests. Please try again later.';

      setError(msg);
      addToast({ type: 'error', title: 'Reset Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const brandPanel = (
    <AuthBrandPanel
      title="Reset password"
      subtitle="Enter your email to receive a reset link."
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
            Reset password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            Enter your email to receive a reset link.
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
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email sent</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Check your inbox for the password reset link sent to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
            </p>

            <Link
              to="/login"
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-sm block text-center hover:opacity-95 transition-opacity"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <AuthInput
              id="forgot-email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="name@example.com"
              error={emailError}
              success={touched && !emailError && !!email}
              autoComplete="email"
              disabled={loading}
              icon={Mail}
            />

            <button
              type="submit"
              disabled={loading || (touched && !!emailError)}
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
                  <span>Sending...</span>
                </span>
              ) : (
                <span>Send Reset Link</span>
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

export default ForgotPassword;
