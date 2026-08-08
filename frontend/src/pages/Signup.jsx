import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { gsap } from 'gsap';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import GoogleButton from '../components/auth/GoogleButton';
import AuthInput from '../components/auth/AuthInput';
import AuthLayout from '../components/auth/AuthLayout';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import Logo from '../components/common/Logo';
import { User, Mail, Lock } from 'lucide-react';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { loginWithGoogle, registerWithEmail, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const cardRef = useRef(null);

  useEffect(() => {
    document.title = 'Create Account | Codovate';
  }, []);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // Entrance animation for Auth Card
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

  // ─── Google Sign-Up Handler ──────────────────────────────
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      await loginWithGoogle();
      addToast({
        type: 'success',
        title: 'Account Created!',
        message: 'Signed up with Google successfully.',
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      if (!msg.includes('cancelled')) {
        setErrors({ form: msg });
        addToast({ type: 'error', title: 'Sign-Up Failed', message: msg });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Email Sign-Up Handler ──────────────────────────────
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!email.trim()) newErrors.email = 'Email address is required.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setEmailLoading(true);
    setErrors({});
    try {
      if (registerWithEmail) {
        await registerWithEmail(email, password, fullName);
      } else {
        await loginWithGoogle();
      }
      addToast({
        type: 'success',
        title: 'Account Created!',
        message: 'Welcome to Codovate!',
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      setErrors({ form: msg });
      addToast({ type: 'error', title: 'Registration Failed', message: msg });
    } finally {
      setEmailLoading(false);
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
            Create your account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Start building with Codovate.
          </p>
        </div>

        {/* Global Error Alert */}
        {errors.form && (
          <div
            className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2 animate-fadeIn"
            role="alert"
          >
            <span className="text-sm shrink-0">⚠️</span>
            <span>{errors.form}</span>
          </div>
        )}

        {/* Google Sign-Up Button */}
        <GoogleButton
          onClick={handleGoogleSignup}
          loading={googleLoading}
          label="Continue with Google"
        />

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
          <span className="absolute bg-white dark:bg-[#111522] px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            OR
          </span>
        </div>

        {/* Email Registration Form */}
        <form onSubmit={handleEmailSignup} className="space-y-3.5" noValidate>
          <AuthInput
            id="signup-name"
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            error={errors.fullName}
            disabled={emailLoading || googleLoading}
            icon={User}
          />

          <AuthInput
            id="signup-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            error={errors.email}
            disabled={emailLoading || googleLoading}
            icon={Mail}
          />

          <AuthInput
            id="signup-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            error={errors.password}
            disabled={emailLoading || googleLoading}
            icon={Lock}
          />

          <button
            type="submit"
            disabled={emailLoading || googleLoading}
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
            {emailLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Card Footer Link */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Already have an account?</span>
          <Link
            to="/login"
            className="font-bold text-[#4F46E5] dark:text-[#6D5DFB] hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;