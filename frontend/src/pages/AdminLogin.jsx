import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import api from '../api/axios';

// Admin tier credentials (shown as quick-fill reference)
const ADMIN_TIERS = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    icon: '⚡',
    email: 'superadmin@codovate.com',
    password: 'Super@Admin#2026',
    access: 'Full system access — all modules',
    color: '#FF4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    textColor: 'text-red-400',
  },
  {
    role: 'college_admin',
    label: 'College Admin',
    icon: '🏛️',
    email: 'college@codovate.com',
    password: 'College@Admin#2026',
    access: 'SVERI College — students, projects, certs',
    color: '#2015FF',
    bg: 'bg-[#2015FF]/10',
    border: 'border-[#2015FF]/20',
    textColor: 'text-[#6060FF]',
  },
  {
    role: 'company_admin',
    label: 'Company Admin',
    icon: '🏢',
    email: 'company@codovate.com',
    password: 'Company@Admin#2026',
    access: 'TCS — jobs, internships, applicants',
    color: '#10B981',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    textColor: 'text-green-400',
  },
];

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

  const quickFill = (tier) => {
    setSelectedTier(tier.role);
    setForm({ email: tier.email, password: tier.password });
    setError('');
  };

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

        {/* 3-Tier Quick Access */}
        <div className="space-y-2">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] text-center">Select Admin Tier to Quick Fill</p>
          <div className="grid grid-cols-3 gap-2">
            {ADMIN_TIERS.map(tier => (
              <button
                key={tier.role}
                onClick={() => quickFill(tier)}
                className={`p-3 rounded-xl border transition-all duration-200 text-left group hover:scale-[1.02] ${
                  selectedTier === tier.role
                    ? `${tier.bg} ${tier.border} shadow-lg`
                    : 'bg-white/3 border-white/5 hover:border-white/10'
                }`}
              >
                <span className="text-lg block mb-1">{tier.icon}</span>
                <p className={`text-[10px] font-black ${selectedTier === tier.role ? tier.textColor : 'text-gray-400'}`}>
                  {tier.label}
                </p>
                <p className="text-[9px] text-gray-600 mt-0.5 leading-tight line-clamp-2">{tier.access}</p>
              </button>
            ))}
          </div>
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

        {/* Credentials Reference */}
        <div className="bg-[#080812]/80 border border-white/5 rounded-2xl p-5">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">📋 All Admin Credentials (Dev Mode)</p>
          <div className="space-y-3">
            {ADMIN_TIERS.map(tier => (
              <div key={tier.role} className={`p-3 rounded-xl ${tier.bg} border ${tier.border}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-black ${tier.textColor}`}>{tier.icon} {tier.label}</span>
                  <button
                    onClick={() => quickFill(tier)}
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${tier.bg} ${tier.textColor} border ${tier.border} hover:opacity-80 transition-all`}
                  >
                    Fill →
                  </button>
                </div>
                <div className="font-mono text-[10px] space-y-0.5">
                  <div className="flex gap-2">
                    <span className="text-gray-600 w-14">Email</span>
                    <span className="text-gray-300">{tier.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-600 w-14">Pass</span>
                    <span className="text-gray-300">{tier.password}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-600 w-14">Access</span>
                    <span className="text-gray-500 text-[9px]">{tier.access}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-700 mt-3 text-center">Run <code className="text-[#6060FF]">node seed-admins.js</code> in backend to create these accounts</p>
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
