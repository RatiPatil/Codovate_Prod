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
          { y: 18, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
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
        title: 'Reset Link Sent',
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
      title="Build. Learn. Grow."
      subtitle="Your journey to skills, projects, and opportunities starts here."
    />
  );

  return (
    <AuthLayout brandPanel={brandPanel}>
      {/* Mobile Top Logo & Headline */}
      <div className="lg:hidden w-full max-w-[400px] mb-5 space-y-2 text-center flex flex-col items-center">
        <Link to="/" className="inline-block focus:outline-none mb-1">
          <Logo size="xs" responsive />
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Build. Learn. Grow.
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Your journey to skills, projects, and opportunities starts here.
        </p>
      </div>

      {/* Main Compact Auth Surface Card */}
      <div
        ref={cardRef}
        className="w-full max-w-[400px] bg-white dark:bg-[#111522] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-5 transition-colors"
      >
        {/* Card Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reset your password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Enter your email and we'll send you a reset link.
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
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Reset link sent</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Check your email for instructions to reset your password for <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
            </p>

            <Link
              to="/login"
              className="w-full h-12 py-3 px-5 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6D5DFB] to-[#7C3AED] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all"
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
              placeholder="Enter your email"
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
                w-full h-12 py-3 px-5 rounded-xl
                bg-gradient-to-r from-[#4F46E5] via-[#6D5DFB] to-[#7C3AED]
                hover:opacity-95 text-white text-xs sm:text-sm font-bold
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35
                hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                transition-all duration-200 flex items-center justify-center gap-2 mt-1
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] dark:text-[#6D5DFB] hover:underline transition-colors"
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
