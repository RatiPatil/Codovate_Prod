import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useToast } from '../components/ui/ToastProvider';
import { validateEmail } from '../utils/validators';
import AuthInput from '../components/auth/AuthInput';
import api from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const formRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    gsap.fromTo(formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
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
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
      addToast({ type: 'success', title: 'Email Sent', message: 'Check your inbox for the reset code.' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      
      <div ref={formRef} className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-white font-bold text-lg">Codovate</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-400 text-sm">Enter your email and we'll send you a reset code.</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl relative">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold auth-fade-in" role="alert">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="text-center auth-fade-in">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Check your email</h3>
              <p className="text-gray-400 text-sm mb-6">
                A 6-digit reset code has been sent to your email address. Please check your inbox (and spam folder).
              </p>
              <Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="btn-primary w-full py-4 block text-center text-sm font-bold">
                Enter Reset Code
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
                placeholder="you@example.com"
                error={emailError}
                success={touched && !emailError && !!email}
                autoComplete="email"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || (touched && !!emailError)}
                className="btn-primary w-full py-4 mt-2 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : 'Send Reset Code'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Remember your password?{' '}
          <Link to="/login" className="text-white hover:text-primary font-bold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
