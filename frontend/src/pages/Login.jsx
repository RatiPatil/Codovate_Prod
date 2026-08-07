import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { gsap } from 'gsap';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import GoogleButton from '../components/auth/GoogleButton';
import CodovateLogo from '../components/common/CodovateLogo';
import LoginWorkspaceVisual from '../components/auth/LoginWorkspaceVisual';
import { Briefcase, Users, BookOpen, Shield } from 'lucide-react';

const Login = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { loginWithGoogle, user } = useAuth();
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

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (logoRef.current) {
        tl.fromTo(
          logoRef.current,
          { opacity: 0, scale: 0.95, y: 10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8 }
        );
      }

      if (infoRef.current) {
        tl.fromTo(
          infoRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
          '-=0.5'
        );
      }

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

  // ─── Google Login Handler ──────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      const resData = await loginWithGoogle();

      addToast({
        type: 'success',
        title: 'Welcome!',
        message: 'Signed in with Google successfully.',
      });

      const adminRoles = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];
      const targetPath =
        adminRoles.includes(resData?.user?.role) ? '/admin' : '/dashboard';

      navigate(targetPath, { replace: true });
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

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row font-sans overflow-x-hidden relative text-slate-900">
      
      {/* Background Decorative Ambient Dots */}
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
          
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-purple-100/70 border border-purple-200/60 mb-6 backdrop-blur-sm">
            <span className="text-xs font-bold text-indigo-700 tracking-wide">
              Welcome to Codovate
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] mb-4 tracking-tight">
            Sign in to <br />
            your{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Codovate
            </span>
          </h1>

          <p className="text-slate-500 text-sm lg:text-base leading-relaxed mb-8 font-normal">
            Access your opportunities, connect with teams, continue learning, and build your future.
          </p>

          <div className="space-y-4">
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

        <div className="mt-auto pt-4">
          <LoginWorkspaceVisual className="w-full" />
        </div>

      </div>

      {/* ── RIGHT SIDE (55% Split Screen / Form Card) ────────────────────── */}
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
            Sign in
          </h2>

          <p className="text-slate-500 text-sm font-medium mb-8">
            Sign in with your Google account to get started.
          </p>

          {errors.form && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3 font-medium auth-fade-in"
              role="alert"
            >
              <span className="text-base">⚠️</span> {errors.form}
            </div>
          )}

          <div className="space-y-4">
            <GoogleButton
              onClick={handleGoogleLogin}
              loading={googleLoading}
              label="Continue with Google"
            />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium text-center">
            <Shield size={16} className="text-indigo-500 shrink-0" />
            <span>Your authentication is secure with Google Sign-In.</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;