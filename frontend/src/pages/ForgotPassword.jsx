import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useToast } from '../components/ui/ToastProvider';
import { validateEmail } from '../utils/validators';
import AuthInput from '../components/auth/AuthInput';
import CodovateLogo from '../components/common/CodovateLogo';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Mail, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const formRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Forgot Password | Codovate';
  }, []);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(formRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
      );
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
        setError("This account uses Google Sign-In. Please continue with Google Login.");
        setLoading(false);
        return;
      }
      
      if (methods.includes('phone')) {
        setError("This account uses Phone Authentication. Please login using your mobile number.");
        setLoading(false);
        return;
      }

      const actionCodeSettings = {
        url: 'https://codovate.in/login',
        handleCodeInApp: false,
      };
      
      await sendPasswordResetEmail(auth, normalizedEmail, actionCodeSettings);
      setSuccess(true);
      addToast({ type: 'success', title: 'Email Sent', message: 'Password reset link has been sent to your email.' });
    } catch (err) {
      console.error(err);
      let msg = 'Something went wrong. Please try again.';
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email address.';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email address format.';
      else if (err.code === 'auth/network-request-failed') msg = 'Network error. Please check your internet connection.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many requests. Please try again later.';
      else if (err.code === 'auth/operation-not-allowed') msg = 'Password reset is not enabled. Please contact support.';
      
      setError(msg);
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
      {/* Background Decorative Ambient Radial Blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-100/40 rounded-full blur-[140px] pointer-events-none z-0" />

      <div ref={formRef} className="w-full max-w-md relative z-10">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block focus:outline-none mb-6">
            <CodovateLogo variant="light" size="xl" className="drop-shadow-sm" />
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Reset password</h2>
          <p className="text-slate-500 text-sm font-medium">Enter your email and we'll send you a reset link.</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-3 auth-fade-in" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {success ? (
            <div className="text-center auth-fade-in py-2">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-slate-900 font-extrabold text-lg mb-2">Check your email</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Password reset link has been sent to <strong>{email}</strong>. Please check your inbox and spam folder.
              </p>
              <Link to="/login" className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-md block text-center">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <AuthInput
                id="forgot-email"
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="name@example.com"
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
                  w-full py-3.5 px-6 mt-2 rounded-xl
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
                    Sending...
                  </span>
                ) : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Remember your password?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

