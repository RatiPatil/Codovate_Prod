import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { gsap } from 'gsap';
import { validateEmail } from '../utils/validators';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import AuthInput from '../components/auth/AuthInput';
import GoogleButton from '../components/auth/GoogleButton';
import PhoneLoginModal from '../components/auth/PhoneLoginModal';
import api from '../api/axios';

const Login = () => {
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formShake, setFormShake] = useState(false);

  const { login, loginWithGoogle, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const formRef = useRef(null);
  const bgRef = useRef(null);
  const infoRef = useRef(null);
  const headingRef = useRef(null);

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

  // GSAP entrance animations
  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();
      if (bgRef.current) tl.fromTo(bgRef.current, { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' });
      if (infoRef.current) tl.fromTo(infoRef.current.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, '-=0.8');
      if (headingRef.current) tl.fromTo(headingRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.8');
      if (formRef.current) tl.fromTo(formRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6');
    });

    return () => ctx.revert();
  }, []);

  // ─── Real-time validation ──────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or username is required.';
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
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
    try {
      const payload = {
        email: form.emailOrUsername.trim().toLowerCase(),
        password: form.password,
      };
      // If input has no @, treat as username login
      if (!form.emailOrUsername.includes('@')) {
        payload.username = form.emailOrUsername.trim().toLowerCase();
        delete payload.email;
      }

      const res = await api.post('/auth/login', payload);
      const { token, user: userData } = res.data;
      login(token, userData, rememberMe);
      addToast({ type: 'success', title: 'Welcome back!', message: `Signed in as ${userData.name || userData.email}` });
      
      // Route based on role
      const adminRoles = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];
      if (adminRoles.includes(userData.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
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
    try {
      await loginWithGoogle();
      addToast({ type: 'success', title: 'Welcome!', message: 'Signed in with Google successfully.' });
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
    <div className="min-h-screen bg-black flex flex-col lg:flex-row overflow-x-hidden overflow-y-auto w-full">
      
      {/* Left Column: Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-white/5">
        <div ref={bgRef} className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-[2px]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-20"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-10" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] z-0" />
        </div>

        <div className="relative z-20">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">C</div>
            <span className="text-white font-bold text-2xl tracking-tight">Codovate</span>
          </Link>
        </div>

        <div ref={infoRef} className="relative z-20 max-w-lg mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">Student Growth OS</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-[1.1] mb-6">
            Accelerate your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#a78bfa]">career growth</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Join thousands of students discovering elite hackathons, exclusive internships, and personalized mentorship — all in one unified ecosystem.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img loading="lazy" decoding="async" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="student" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm font-medium">Over 10,000+ students joined</p>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 relative min-h-screen lg:min-h-0">
        
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-white font-bold text-lg">Codovate</span>
          </Link>
        </div>

        <div ref={formRef} className="w-full max-w-md mt-16 lg:mt-0">
          <div ref={headingRef} className="mb-8 text-center lg:text-left">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 drop-shadow-md">Welcome back</h2>
            <p className="text-gray-400 text-base font-medium tracking-wide">Sign in to your account to continue</p>
          </div>

          <div className={`glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden ${formShake ? 'auth-shake' : ''}`}>
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
            
            {/* Global form error */}
            {errors.form && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 font-semibold auth-fade-in" role="alert">
                <span>⚠️</span> {errors.form}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 relative z-10" noValidate>
              <AuthInput
                id="login-email"
                label="Email or Username"
                type="text"
                value={form.emailOrUsername}
                onChange={e => handleChange('emailOrUsername', e.target.value)}
                onBlur={() => handleBlur('emailOrUsername')}
                placeholder="hello@example.com or john_doe"
                error={touched.emailOrUsername ? errors.emailOrUsername : null}
                success={touched.emailOrUsername && !errors.emailOrUsername && !!form.emailOrUsername}
                autoComplete="username"
                disabled={loading}
              />

              <AuthInput
                id="login-password"
                label="Password"
                type="password"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                error={touched.password ? errors.password : null}
                autoComplete="current-password"
                disabled={loading}
              />

              {/* Remember Me + Forgot Password row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors font-medium">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-light font-bold transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="btn-primary w-full py-3.5 disabled:opacity-50 mt-3 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6 relative z-10">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="relative z-10 flex flex-col gap-3">
              <GoogleButton
                onClick={handleGoogleLogin}
                loading={googleLoading}
                disabled={loading}
                label="Sign in with Google"
              />
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Continue with Phone
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:text-primary font-bold transition-colors">Create one</Link>
          </p>
        </div>
      </div>
      
      <PhoneLoginModal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} />
    </div>
  );
};

export default Login;