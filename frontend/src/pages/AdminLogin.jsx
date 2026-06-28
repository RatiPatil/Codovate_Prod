import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import api from '../api/axios';

// Admin tiers for UI labels only (if needed later)

const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const formRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2 });
    gsap.fromTo(formRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-login', form);
      login(res.data.token, res.data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
      gsap.fromTo(formRef.current, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2015FF]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px]" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div ref={formRef} className="w-full max-w-lg relative z-10 space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2015FF]/15 border border-[#2015FF]/30 mb-5 shadow-[0_0_30px_rgba(32,21,255,0.3)]">
            <span className="text-2xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Portal</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Restricted Access — Codovate HQ</p>
        </div>



        {/* Login Card */}
        <div className="bg-[#080812]/90 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#2015FF]/40 to-transparent" />

          <div className="p-7 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 font-semibold">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Admin Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@codovate.com"
                  required
                  className="w-full bg-black/40 border border-white/8 rounded-xl py-3.5 px-4 text-white text-sm placeholder-gray-600 focus:border-[#2015FF]/60 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-black/40 border border-white/8 rounded-xl py-3.5 px-4 pr-10 text-white text-sm placeholder-gray-600 focus:border-[#2015FF]/60 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#2015FF] hover:bg-[#3525FF] text-white rounded-xl text-sm font-black tracking-wide shadow-[0_4px_20px_rgba(32,21,255,0.4)] hover:shadow-[0_6px_30px_rgba(32,21,255,0.6)] disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : '🔐 Access Admin Dashboard'}
              </button>
            </form>
          </div>
        </div>



        <div className="text-center">
          <Link to="/login" className="text-gray-600 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
            ← Back to Student Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
