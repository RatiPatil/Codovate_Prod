import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { gsap } from 'gsap';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import AuthInput from '../components/auth/AuthInput';
import GoogleButton from '../components/auth/GoogleButton';
import PhoneLoginModal from '../components/auth/PhoneLoginModal';
import CodovateLogo from '../components/common/CodovateLogo';
import LoginWorkspaceVisual from '../components/auth/LoginWorkspaceVisual';
import api from '../api/axios';
import { Briefcase, Users, BookOpen, User, Lock, Phone, Shield } from 'lucide-react';

const Login = () => {
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [formShake, setFormShake] = useState(false);

  const { login, loginWithGoogle, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const logoRef = useRef(null);
  const formRef = useRef(null);
  const infoRef = useRef(null);

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

  // GSAP entrance animations matching specification
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // One-time premium logo reveal
      if (logoRef.current) {
        tl.fromTo(
          logoRef.current,
          { opacity: 0, scale: 0.95, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8 }
        );
      }

      // Staggered info content
      if (infoRef.current) {
        tl.fromTo(
          infoRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
          '-=0.5'
        );
      }

      // Card slide in
      if (formRef.current) {
        tl.fromTo(
          formRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          '-=0.6'
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // ─── Real-time validation ──────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or phone number is required.';
    }
    if (!form.password) {
      newErrors.password = 'Password is required.';
    }
    return newErrors;
  }, [form]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate());
    }
  }, [form, touched, validate]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Email/Password Login ──────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ emailOrUsername: true, password: true });
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFormShake(true);
      setTimeout(() => setFormShake(false), 400);
      return;
    }

    setLoading(true);
    const tClick = performance.now();
    try {
      const payload = {
        email: form.emailOrUsername.trim().toLowerCase(),
        password: form.password,
      };
      if (!form.emailOrUsername.includes('@')) {
        payload.username = form.emailOrUsername.trim().toLowerCase();
        delete payload.email;
      }

      const tApiStart = performance.now();
      const res = await api.post('/auth/login', payload);
      const tApiEnd = performance.now();

      const { token, user: userData, redirect: backendRedirect } = res.data;
      login(token, userData, true);
      const tContextEnd = performance.now();

      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: `Signed in as ${userData.name || userData.email}`,
      });

      const adminRoles = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];
      const targetPath =
        backendRedirect || (adminRoles.includes(userData.role) ? '/admin' : '/dashboard');

      navigate(targetPath, { replace: true });
      const tNavEnd = performance.now();

      console.log(
        `%c⚡ CODOVATE LOGIN PERFORMANCE (Email) ⚡\n` +
          `Backend Auth Session: ${(tApiEnd - tApiStart).toFixed(0)}ms\n` +
          `State & Context Update: ${(tContextEnd - tApiEnd).toFixed(0)}ms\n` +
          `Navigation & Redirect: ${(tNavEnd - tContextEnd).toFixed(0)}ms\n` +
          `TOTAL LOGIN TIME: ${(tNavEnd - tClick).toFixed(0)}ms`,
        'color: #2563eb; font-weight: bold; font-size: 13px;'
      );
    } catch (err) {
      let msg = getFirebaseErrorMessage(err);
      if (err.isAxiosError && !err.response) {
        msg = 'Network error. Server unreachable. Please check your connection.';
      }
      setErrors({ form: msg });
      setFormShake(true);
      setTimeout(() => setFormShake(false), 400);
      addToast({ type: 'error', title: 'Login Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Login ──────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrors({});
    const tClick = performance.now();
    try {
      const resData = await loginWithGoogle();
      const tAuthEnd = performance.now();

      addToast({
        type: 'success',
        title: 'Welcome!',
        message: 'Signed in with Google successfully.',
      });

      const adminRoles = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];
      const targetPath =
        resData?.redirect ||
        (adminRoles.includes(resData?.user?.role) ? '/admin' : '/dashboard');

      navigate(targetPath, { replace: true });
      const tNavEnd = performance.now();

      console.log(
        `%c⚡ CODOVATE LOGIN PERFORMANCE (Google) ⚡\n` +
          `Firebase + Backend Auth: ${(tAuthEnd - tClick).toFixed(0)}ms\n` +
          `Navigation & Redirect: ${(tNavEnd - tAuthEnd).toFixed(0)}ms\n` +
          `TOTAL LOGIN TIME: ${(tNavEnd - tClick).toFixed(0)}ms`,
        'color: #2563eb; font-weight: bold; font-size: 13px;'
      );
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      if (!msg.includes('cancelled')) {
        setErrors({ form: msg });
        addToast({ type: 'error', title: 'Google Sign-In Failed', message: msg });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isFormValid = form.emailOrUsername.trim() && form.password;

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row font-sans overflow-x-hidden relative text-slate-900">
      
      {/* Background Decorative Ambient Dots & Radial Blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-100/40 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Grid Pattern Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(#0F172A 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── LEFT SIDE (45% Split Screen on Desktop) ────────────────────── */}
      <div className="hidden lg:flex w-full lg:w-[45%] flex-col justify-between p-10 lg:p-14 relative z-10 select-none">
        
        {/* Top: Official Codovate Logo (Light Variant) */}
        <div ref={logoRef} className="pt-2">
          <Link to="/" className="inline-block focus:outline-none">
            <CodovateLogo variant="light" size="xl" className="drop-shadow-sm" />
          </Link>
        </div>

        {/* Welcome Content */}
        <div ref={infoRef} className="max-w-md my-auto py-6">
          
          {/* Small Pill */}
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-purple-100/70 border border-purple-200/60 mb-6 backdrop-blur-sm">
            <span className="text-xs font-bold text-indigo-700 tracking-wide">
              Welcome Back!
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] mb-4 tracking-tight">
            Sign in to <br />
            your{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Codovate
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-slate-500 text-sm lg:text-base leading-relaxed mb-8 font-normal">
            Access your opportunities, connect with teams, continue learning, and build your future.
          </p>

          {/* Feature Benefits List */}
          <div className="space-y-4">
            
            {/* Benefit 1 */}
            <div className="flex items-start gap-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <Briefcase size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  Discover Opportunities
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Find internships, jobs & more
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start gap-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <Users size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  Collaborate in Teams
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect, build & grow together
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start gap-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <BookOpen size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  Learn & Upskill
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track progress and achieve goals
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Workspace Illustration Visual */}
        <div className="mt-auto pt-4">
          <LoginWorkspaceVisual className="w-full" />
        </div>

      </div>

      {/* ── RIGHT SIDE (55% Split Screen / Form Card) ────────────────────── */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative z-10 min-h-screen lg:min-h-0">
        
        {/* Mobile Header Logo */}
        <div className="lg:hidden w-full max-w-md mb-6 flex justify-start">
          <Link to="/">
            <CodovateLogo variant="light" size="lg" />
          </Link>
        </div>

        {/* Right Premium Login Card */}
        <div
          ref={formRef}
          className={`w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden transition-all duration-300 ${
            formShake ? 'auth-shake' : ''
          }`}
        >
          {/* Card Title */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Sign in
          </h2>

          {/* Subtitle / Signup Link */}
          <p className="text-slate-500 text-sm font-medium mb-8">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* Global Form Error */}
          {errors.form && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3 font-medium auth-fade-in"
              role="alert"
            >
              <span className="text-base">⚠️</span> {errors.form}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            
            {/* Email or Phone field */}
            <AuthInput
              id="login-email"
              label="Email or Phone Number"
              type="text"
              value={form.emailOrUsername}
              onChange={(e) => handleChange('emailOrUsername', e.target.value)}
              onBlur={() => handleBlur('emailOrUsername')}
              placeholder="Enter your email or phone number"
              error={touched.emailOrUsername ? errors.emailOrUsername : null}
              success={touched.emailOrUsername && !errors.emailOrUsername && !!form.emailOrUsername}
              autoComplete="username"
              disabled={loading}
              icon={User}
            />

            {/* Password field */}
            <div>
              <AuthInput
                id="login-password"
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Enter your password"
                error={touched.password ? errors.password : null}
                autoComplete="current-password"
                disabled={loading}
                icon={Lock}
              />

              {/* Forgot Password link right-aligned */}
              <div className="flex justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Primary Sign-In Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="
                w-full py-3.5 px-6 mt-2 rounded-xl
                bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                hover:from-blue-700 hover:to-purple-700
                text-white font-semibold text-sm sm:text-base tracking-wide
                shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                transition-all duration-200 flex items-center justify-center gap-2 group
              "
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign in</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>

          </form>

          {/* Social Auth Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              or continue with
            </span>
          </div>

          {/* Functional Social Auth Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            <GoogleButton
              onClick={handleGoogleLogin}
              loading={googleLoading}
              disabled={loading}
              label="Google"
            />
            <button
              type="button"
              onClick={() => setIsPhoneModalOpen(true)}
              disabled={loading}
              className="
                flex items-center justify-center gap-2 py-3 px-4
                bg-white hover:bg-slate-50 active:bg-slate-100
                border border-slate-200 rounded-xl font-semibold text-sm text-slate-700
                shadow-sm hover:shadow transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-4 focus:ring-indigo-500/10
              "
            >
              <Phone size={17} className="text-slate-600" />
              <span>Phone</span>
            </button>
          </div>

          {/* Security Message */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium text-center">
            <Shield size={16} className="text-indigo-500 shrink-0" />
            <span>Your data is secure with us. We never share your information.</span>
          </div>

        </div>

      </div>

      <PhoneLoginModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />

    </div>
  );
};

export default Login;