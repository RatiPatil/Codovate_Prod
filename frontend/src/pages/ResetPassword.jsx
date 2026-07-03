import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { useToast } from '../components/ui/ToastProvider';
import { validatePassword, validateConfirmPassword } from '../utils/validators';
import AuthInput from '../components/auth/AuthInput';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';
import api from '../api/axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const [form, setForm] = useState({ email: initialEmail, code: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});
  
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    gsap.fromTo(formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const passwordValidation = validatePassword(form.newPassword);
  const confirmError = touched.confirmPassword ? validateConfirmPassword(form.newPassword, form.confirmPassword) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });
    
    if (passwordValidation.error || validateConfirmPassword(form.newPassword, form.confirmPassword)) return;
    
    setError('');
    setLoading(true);
    
    try {
      await api.post('/auth/reset-password', {
        email: form.email.trim().toLowerCase(),
        code: form.code.trim(),
        newPassword: form.newPassword,
      });
      setSuccess(true);
      addToast({ type: 'success', title: 'Password Reset!', message: 'Your password has been updated. Redirecting to login...' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid code or something went wrong.';
      setError(msg);
      addToast({ type: 'error', title: 'Reset Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      
      <div ref={formRef} className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-white font-bold text-lg">Codovate</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Create New Password</h2>
          <p className="text-gray-400 text-sm">Enter the 6-digit code and your new password.</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl relative">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold auth-fade-in" role="alert">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 auth-fade-in">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Password Reset Successful</h3>
              <p className="text-gray-400 text-sm mb-6">
                You will be redirected to the login page momentarily.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <AuthInput
                id="reset-email"
                label="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                autoComplete="email"
                disabled={!!initialEmail || loading}
              />

              <div>
                <label htmlFor="reset-code" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">6-Digit Code</label>
                <input
                  id="reset-code"
                  type="text"
                  maxLength="6"
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value.replace(/\D/g, '')})}
                  placeholder="000000"
                  required
                  disabled={loading}
                  className="input-glass w-full py-3 px-4 text-sm tracking-[0.5em] text-center font-mono text-white"
                />
              </div>

              <AuthInput
                id="reset-new-password"
                label="New Password"
                type="password"
                value={form.newPassword}
                onChange={e => setForm({...form, newPassword: e.target.value})}
                onBlur={() => handleBlur('newPassword')}
                placeholder="Min 8 characters"
                error={touched.newPassword ? passwordValidation.error : null}
                autoComplete="new-password"
                disabled={loading}
              >
                <PasswordStrengthMeter password={form.newPassword} show={!!form.newPassword} />
              </AuthInput>

              <AuthInput
                id="reset-confirm-password"
                label="Confirm New Password"
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({...form, confirmPassword: e.target.value})}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Re-enter password"
                error={confirmError}
                success={touched.confirmPassword && !confirmError && !!form.confirmPassword}
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 mt-2 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : 'Reset Password'}
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

export default ResetPassword;
