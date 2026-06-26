import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../api/axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const [form, setForm] = useState({ email: initialEmail, code: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const formRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/auth/reset-password', form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code or something went wrong.');
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
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Password Reset Successful</h3>
              <p className="text-gray-400 text-sm mb-6">
                You will be redirected to the login page momentarily.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                  className="input-glass w-full py-4 px-4 text-sm bg-white/5"
                  readOnly={!!initialEmail}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">6-Digit Code</label>
                <input
                  type="text"
                  maxLength="6"
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value})}
                  placeholder="000000"
                  required
                  className="input-glass w-full py-4 px-4 text-sm tracking-[0.5em] text-center font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={e => setForm({...form, newPassword: e.target.value})}
                  placeholder="Min 6 characters"
                  required
                  className="input-glass w-full py-4 px-4 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 mt-2 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
