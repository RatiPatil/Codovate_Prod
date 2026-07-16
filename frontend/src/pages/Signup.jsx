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

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // GSAP entrance animations
  useEffect(() => {
    const tl = gsap.timeline();
    if (bgRef.current) tl.fromTo(bgRef.current, { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' });
    if (infoRef.current) tl.fromTo(infoRef.current.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, '-=0.8');
    if (headingRef.current) tl.fromTo(headingRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.8');
    if (formRef.current) tl.fromTo(formRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6');
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
      
      // Attempt to sign in locally and send verification email
      try {
        await signInWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
        }
      } catch (fbErr) {
        console.warn("Could not sign in to Firebase to send verification:", fbErr);
      }

      setIsSignupComplete(true);
      addToast({ type: 'success', title: 'Account Created!', message: 'Please check your email to verify your account.' });
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
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
    if (usernameAvailable === true && !errors.username) return { text: 'Available ✓', color: 'text-green-400' };
    return null;
  };
  const usernameStatus = getUsernameStatus();

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row overflow-x-hidden overflow-y-auto w-full">
      
      {/* Left Column: Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-white/5">
        <div ref={bgRef} className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-[2px]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-20"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop")',
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
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">Join the community</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-[1.1] mb-6">
            Build your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#a78bfa]">future today</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Stop waiting for opportunities to come to you. Create your account and get access to top tier-1 internships, hackathons, and a community of builders.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[5,6,7,8].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img loading="lazy" decoding="async" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+20}`} alt="student" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm font-medium">Join 10,000+ top students</p>
          </div>
        </div>
      </div>

      {/* Right Column: Signup Form */}
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
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 drop-shadow-md">
              {isSignupComplete ? 'Check your email' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-base font-medium tracking-wide">
              {isSignupComplete ? 'We have sent a verification link to your email.' : <span>Start your career journey with <span className="text-primary font-bold">Codovate</span></span>}
            </p>
          </div>

          <div className={`glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden ${formShake ? 'auth-shake' : ''}`}>
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
            
            {isSignupComplete ? (
              <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm">
                  Please click the link in the email we sent to <strong>{form.email}</strong> to verify your account.
                </p>
                <Link to="/login" className="btn-primary w-full py-3.5 mt-4 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 block">
                  Go to Login
                </Link>
              </div>
            ) : (
              <>
                {/* Global form error */}
                {errors.form && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 font-semibold auth-fade-in" role="alert">
                <span>⚠️</span> {errors.form}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4 relative z-10" noValidate>
              <div className="relative">
                <AuthInput
                  id="signup-fullname"
                  label="Full Name *"
                  type="text"
                  value={form.fullName}
                  onChange={e => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Example: VIVEK DAYANAND CHAVAN"
                  error={touched.fullName ? errors.fullName : null}
                  success={touched.fullName && !errors.fullName && form.fullName.length > 2}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <AuthInput
                  id="signup-username"
                  label="Username"
                  type="text"
                  value={form.username}
                  onChange={e => handleChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  placeholder="john_doe"
                  error={touched.username ? errors.username : null}
                  success={touched.username && !errors.username && usernameAvailable === true}
                  autoComplete="username"
                  maxLength={25}
                  disabled={loading}
                />
                {usernameStatus && (
                  <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${usernameStatus.color}`}>
                    {usernameStatus.text}
                  </p>
                )}
              </div>

              <AuthInput
                id="signup-email"
                label="Email Address"
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="hello@example.com"
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
                onChange={e => handleChange('password', e.target.value)}
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
                onChange={e => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Re-enter password"
                error={touched.confirmPassword ? errors.confirmPassword : null}
                success={touched.confirmPassword && !errors.confirmPassword && !!form.confirmPassword}
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="btn-primary w-full py-3.5 disabled:opacity-50 mt-4 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6 relative z-10">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Or sign up with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="relative z-10 flex flex-col gap-3">
              <GoogleButton
                onClick={handleGoogleSignup}
                loading={googleLoading}
                disabled={loading}
                label="Continue with Google"
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
              </>
            )}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:text-primary font-bold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
      
      <PhoneLoginModal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} />
    </div>
  );
};

export default Signup;