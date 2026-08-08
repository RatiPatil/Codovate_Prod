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
import { Mail, Lock, ShieldCheck, ArrowRight, Briefcase, Users, BookOpen } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { loginWithGoogle, loginWithEmail, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const cardRef = useRef(null);

  useEffect(() => {
    document.title = 'Sign In | Codovate';
  }, []);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (user) {
      const adminRoles = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];
      if (adminRoles.includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
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

  // ─── Google Sign-In Handler ──────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      const resData = await loginWithGoogle();
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Signed in with Google successfully.',
      });
      const adminRoles = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];
      const targetPath = adminRoles.includes(resData?.user?.role) ? '/admin' : '/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      if (!msg.includes('cancelled')) {
        setErrors({ form: msg });
        addToast({ type: 'error', title: 'Sign-In Failed', message: msg });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Email/Password Handler ──────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrors({ form: 'Please fill in all fields.' });
      return;
    }

    setEmailLoading(true);
    setErrors({});
    try {
      if (loginWithEmail) {
        await loginWithEmail(email, password);
      }
      addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Signed in successfully.',
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      setErrors({ form: msg });
      addToast({ type: 'error', title: 'Sign-In Failed', message: msg });
    } finally {
      setEmailLoading(false);
    }
  };

  const brandPanel = (
    <AuthBrandPanel
      badge="Welcome Back"
      title="Continue Building Your Future."
      subtitle="Access your customized career dashboard, active project workspaces, skill assessments, and mentor networks."
      benefits={[
        {
          icon: Briefcase,
          title: 'Career Trajectory',
          desc: 'Track internship applications and recruiter updates',
        },
        {
          icon: Users,
          title: 'Collaborative Projects',
          desc: 'Manage microservices & code repos with team tools',
        },
        {
          icon: BookOpen,
          title: 'Curated Modules',
          desc: 'Continue your DSA and system design progress',
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
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Sign in to continue your Codovate journey.
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

        {/* Google Sign-In Button */}
        <GoogleButton
          onClick={handleGoogleLogin}
          loading={googleLoading}
          label="Continue with Google"
        />

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
          <span className="absolute bg-white dark:bg-[#111522] px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            OR
          </span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
          <AuthInput
            id="login-email"
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
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={emailLoading || googleLoading}
            icon={Lock}
          >
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </AuthInput>

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
                <span>Signing you in...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Don't have an account?</span>
          <Link
            to="/signup"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;