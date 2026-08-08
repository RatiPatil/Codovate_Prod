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
import { User, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2, Rocket, Code2 } from 'lucide-react';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  // GSAP entrance animation for Auth Card
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
    if (!email || !password) {
      setErrors({ form: 'Please fill in all required fields.' });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
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
      badge="Create Account"
      title="Build Your Skills. Build Your Portfolio. Build Your Career."
      subtitle="Join thousands of computer science students and software engineering aspirants leveling up on Codovate."
      benefits={[
        {
          icon: CheckCircle2,
          title: '100% Free for Ambitious Learners',
          desc: 'Access DSA problems, roadmaps, and open resources',
        },
        {
          icon: Code2,
          title: 'Production Project Workspaces',
          desc: 'Build real-time full-stack web and AI applications',
        },
        {
          icon: Rocket,
          title: 'ATS Resume & Placement Prep',
          desc: 'Prepare for top tech companies and recruiters',
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
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Global Form Error Alert */}
        {errors.form && (
          <div
            className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn"
            role="alert"
          >
            <span className="text-base shrink-0">⚠️</span>
            <span>{errors.form}</span>
          </div>
        )}

        {/* Google Sign-Up Button */}
        <GoogleButton
          onClick={handleGoogleSignup}
          loading={googleLoading}
          label="Sign up with Google"
        />

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
          <span className="absolute bg-white dark:bg-[#111522] px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
            placeholder="John Doe"
            autoComplete="name"
            disabled={emailLoading || googleLoading}
            icon={User}
          />

          <AuthInput
            id="signup-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            disabled={emailLoading || googleLoading}
            icon={Mail}
          />

          <AuthInput
            id="signup-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={emailLoading || googleLoading}
            icon={Lock}
          />

          {confirmPassword !== '' && password !== confirmPassword && (
            <AuthInput
              id="signup-confirm-password"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              error="Passwords do not match"
              disabled={emailLoading || googleLoading}
              icon={Lock}
            />
          )}

          <button
            type="submit"
            disabled={emailLoading || googleLoading}
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
            {emailLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Creating your account...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Fast and secure registration powered by Codovate.</span>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;