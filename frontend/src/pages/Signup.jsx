import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { gsap } from 'gsap';
import api from '../api/axios';
import { validateUsername, validateEmail, validatePassword, validateConfirmPassword } from '../utils/validators';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthInput from '../components/auth/AuthInput';
import Logo from '../components/common/Logo';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';
import GoogleButton from '../components/auth/GoogleButton';
import PhoneLoginModal from '../components/auth/PhoneLoginModal';

const Signup = () => {
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [formShake, setFormShake] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null | true | false
  const [isSignupComplete, setIsSignupComplete] = useState(false);

  const { login, loginWithGoogle, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const usernameTimerRef = useRef(null);

  const formRef = useRef(null);
  const bgRef = useRef(null);
  const infoRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    document.title = 'Codovate | Sign Up';
  }, []);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/dashboard');
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
    if (!form.fullName || form.fullName.trim().length < 3) {
      newErrors.fullName = 'Full Name must be at least 3 characters.';
    } else if (form.fullName.trim().length > 100) {
      newErrors.fullName = 'Full Name must not exceed 100 characters.';
    }

    const usernameErr = validateUsername(form.username);
    if (usernameErr) newErrors.username = usernameErr;
    else if (usernameAvailable === false) newErrors.username = 'This username is already taken.';

    const emailErr = validateEmail(form.email);
    if (emailErr) newErrors.email = emailErr;

    const { error: pwErr } = validatePassword(form.password);
    if (pwErr) newErrors.password = pwErr;

    const confirmErr = validateConfirmPassword(form.password, form.confirmPassword);
    if (confirmErr) newErrors.confirmPassword = confirmErr;

    return newErrors;
  }, [form, usernameAvailable]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate());
    }
  }, [form, touched, validate, usernameAvailable]);

  // ─── Debounced username uniqueness check ───────────────
  useEffect(() => {
    if (!form.username || validateUsername(form.username)) {
      setUsernameAvailable(null);
      return;
    }
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

    setUsernameChecking(true);
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username/${encodeURIComponent(form.username.trim().toLowerCase())}`);
        setUsernameAvailable(res.data.available);
      } catch {
        setUsernameAvailable(null); // Fail silently — server-side will catch on submit
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(usernameTimerRef.current);
  }, [form.username]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (field, value) => {
    let finalValue = value;
    if (field === 'fullName') {
      // AUTH-003 FIX: Allow natural typing. Only strip dangerous characters.
      // Uppercase conversion happens on submit (backend handles it).
      finalValue = value.replace(/[^a-zA-Z\s\-']/g, '');
    }
    setForm(prev => ({ ...prev, [field]: finalValue }));
    if (field === 'username') setUsernameAvailable(null);
  };

  // ─── Signup Submit ─────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setTouched({ fullName: true, username: true, email: true, password: true, confirmPassword: true });
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFormShake(true);
      setTimeout(() => setFormShake(false), 400);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        username: form.username.trim().toLowerCase(),
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      
      const { token, user: userData } = res.data;
      login(token, userData, true);
      addToast({ type: 'success', title: 'Account Created!', message: 'Welcome to Codovate!' });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      let msg = getFirebaseErrorMessage(err);
      if (err.isAxiosError && !err.response) {
        msg = 'Network error. Server unreachable. Please check your connection.';
      }
      setErrors({ form: msg });
      setFormShake(true);
      setTimeout(() => setFormShake(false), 400);
      addToast({ type: 'error', title: 'Signup Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Signup ─────────────────────────────────────
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      await loginWithGoogle();
      addToast({ type: 'success', title: 'Welcome!', message: 'Account created with Google successfully.' });
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      if (!msg.includes('cancelled')) {
        setErrors({ form: msg });
        addToast({ type: 'error', title: 'Google Sign-Up Failed', message: msg });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const { strength } = validatePassword(form.password);
  const isFormValid = !validateUsername(form.username) && !validateEmail(form.email) && !validatePassword(form.password).error && !validateConfirmPassword(form.password, form.confirmPassword) && usernameAvailable !== false;

  // Username status label
  const getUsernameStatus = () => {
    if (!touched.username || !form.username) return null;
    if (usernameChecking) return { text: 'Checking...', color: 'text-gray-400' };
    if (usernameAvailable === true && !errors.username) return { text: 'Available ✓', color: 'text-green-500' };
    return null;
  };
  const usernameStatus = getUsernameStatus();

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

      {/* Left Column: Branding */}
      <div className="hidden lg:flex w-full lg:w-[45%] flex-col justify-between p-10 lg:p-14 relative z-10 select-none">
        <div>
          <Link to="/" className="inline-block focus:outline-none">
            <CodovateLogo variant="light" size="xl" className="drop-shadow-sm" />
          </Link>
        </div>

        <div ref={infoRef} className="max-w-md my-auto py-6">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-purple-100/70 border border-purple-200/60 mb-6 backdrop-blur-sm">
            <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
              Join the Community
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] mb-4 tracking-tight">
            Build your <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              future today
            </span>
          </h1>
          <p className="text-slate-500 text-sm lg:text-base leading-relaxed mb-8">
            Create your account to unlock top internships, hackathons, team collaborations, and personalized learning paths.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                >
                  <img
                    loading="lazy"
                    decoding="async"
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`}
                    alt="student"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-sm font-semibold">Join 10,000+ top students</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium pt-4">
          © {new Date().getFullYear()} Codovate. All rights reserved.
        </div>
      </div>

      {/* Right Column: Signup Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative z-10 min-h-screen lg:min-h-0">
        {/* Mobile Logo */}
        <div className="lg:hidden w-full max-w-md mb-6 flex justify-start">
          <Link to="/">
            <CodovateLogo variant="light" size="lg" />
          </Link>
        </div>

        <div ref={formRef} className="w-full max-w-lg">
          <div ref={headingRef} className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {isSignupComplete ? 'Check your email' : 'Create account'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {isSignupComplete ? (
                'We have sent a verification link to your email.'
              ) : (
                <span>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                  >
                    Sign in
                  </Link>
                </span>
              )}
            </p>
          </div>

          <div
            className={`bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden transition-all duration-300 ${
              formShake ? 'auth-shake' : ''
            }`}
          >
            {isSignupComplete ? (
              <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Please click the link in the email we sent to <strong>{form.email}</strong> to verify your account.
                </p>
                <Link
                  to="/login"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-center text-sm shadow-md block"
                >
                  Go to Sign In
                </Link>
              </div>
            ) : (
              <>
                {/* Global form error */}
                {errors.form && (
                  <div
                    className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3 font-medium auth-fade-in"
                    role="alert"
                  >
                    <span>⚠️</span> {errors.form}
                  </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4 relative z-10" noValidate>
                  <AuthInput
                    id="signup-fullname"
                    label="Full Name *"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Enter your full name"
                    error={touched.fullName ? errors.fullName : null}
                    success={touched.fullName && !errors.fullName && form.fullName.length > 2}
                    autoComplete="name"
                    disabled={loading}
                  />

                  <div>
                    <AuthInput
                      id="signup-username"
                      label="Username"
                      type="text"
                      value={form.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      onBlur={() => handleBlur('username')}
                      placeholder="Choose a username"
                      error={touched.username ? errors.username : null}
                      success={touched.username && !errors.username && usernameAvailable === true}
                      autoComplete="username"
                      maxLength={25}
                      disabled={loading}
                    />
                    {usernameStatus && (
                      <p className={`mt-1 text-xs font-semibold ${usernameStatus.color}`}>
                        {usernameStatus.text}
                      </p>
                    )}
                  </div>

                  <AuthInput
                    id="signup-email"
                    label="Email Address"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="name@example.com"
                    error={touched.email ? errors.email : null}
                    success={touched.email && !errors.email && !!form.email}
                    autoComplete="email"
                    disabled={loading}
                  />

                  <AuthInput
                    id="signup-password"
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Min 8 characters"
                    error={touched.password ? errors.password : null}
                    autoComplete="new-password"
                    disabled={loading}
                  >
                    <PasswordStrengthMeter password={form.password} show={!!form.password} />
                  </AuthInput>

                  <AuthInput
                    id="signup-confirm-password"
                    label="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Re-enter password"
                    error={touched.confirmPassword ? errors.confirmPassword : null}
                    success={
                      touched.confirmPassword &&
                      !errors.confirmPassword &&
                      !!form.confirmPassword
                    }
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="
                      w-full py-3.5 px-6 mt-3 rounded-xl
                      bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                      hover:from-blue-700 hover:to-purple-700
                      text-white font-semibold text-sm sm:text-base tracking-wide
                      shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                      hover:-translate-y-0.5 active:translate-y-0
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                      transition-all duration-200 flex items-center justify-center gap-2
                    "
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                <div className="relative flex items-center justify-center my-6">
                  <div className="w-full border-t border-slate-200" />
                  <span className="absolute bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    or sign up with
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <GoogleButton
                    onClick={handleGoogleSignup}
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
              </>
            )}
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

export default Signup;