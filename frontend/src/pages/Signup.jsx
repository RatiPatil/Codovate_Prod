import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { gsap } from 'gsap';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import CodovateLogo from '../components/common/CodovateLogo';
import GoogleButton from '../components/auth/GoogleButton';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';

const Signup = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { loginWithGoogle, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const formRef = useRef(null);
  const bgRef = useRef(null);
  const infoRef = useRef(null);

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
      if (formRef.current) tl.fromTo(formRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6');
    });

    return () => ctx.revert();
  }, []);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      await loginWithGoogle();
      addToast({
        type: 'success',
        title: 'Account created!',
        message: 'Signed up with Google successfully.',
      });
      navigate('/dashboard', { replace: true });
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

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row font-sans overflow-x-hidden relative text-slate-900">
      <div ref={bgRef} className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-100/40 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Left side info */}
      <div className="hidden lg:flex w-full lg:w-[45%] flex-col justify-between p-10 lg:p-14 relative z-10 select-none">
        <div className="pt-2">
          <Link to="/">
            <CodovateLogo variant="light" size="xl" className="drop-shadow-sm" />
          </Link>
        </div>

        <div ref={infoRef} className="max-w-md my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/70 border border-indigo-200/60 mb-6 backdrop-blur-sm">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 tracking-wide">
              Create Your Account
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] mb-4 tracking-tight">
            Join <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Codovate
            </span>{' '}
            Today
          </h1>

          <p className="text-slate-500 text-sm lg:text-base leading-relaxed mb-8 font-normal">
            Build your portfolio, find career opportunities, collaborate with peers, and level up your skills.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">100% Free for Students</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">Instant Google Account Sign-In</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">Access to Internships & Projects</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium pt-4">
          © {new Date().getFullYear()} Codovate Technologies. All rights reserved.
        </div>
      </div>

      {/* Right side sign-up card */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative z-10 min-h-screen lg:min-h-0">
        <div className="lg:hidden w-full max-w-md mb-6 flex justify-start">
          <Link to="/">
            <CodovateLogo variant="light" size="lg" />
          </Link>
        </div>

        <div
          ref={formRef}
          className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden transition-all duration-300"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Create Account
          </h2>

          <p className="text-slate-500 text-sm font-medium mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
              Sign in
            </Link>
          </p>

          {errors.form && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3 font-medium auth-fade-in" role="alert">
              <span className="text-base">⚠️</span> {errors.form}
            </div>
          )}

          <div className="space-y-4">
            <GoogleButton
              onClick={handleGoogleSignup}
              loading={googleLoading}
              label="Sign up with Google"
            />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium text-center">
            <Shield size={16} className="text-indigo-500 shrink-0" />
            <span>Fast and secure registration powered by Google Sign-In.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;