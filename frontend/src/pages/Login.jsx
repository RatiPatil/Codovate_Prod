import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import api from '../api/axios';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const formRef = useRef(null);
  const bgRef = useRef(null);
  const infoRef = useRef(null);
  const headingRef = useRef(null);

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.response?.data?.message || 'Google login failed.');
    }
  };

  useEffect(() => {
    const tl = gsap.timeline();

    if (bgRef.current) {
      tl.fromTo(bgRef.current,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
      );
    }

    if (infoRef.current) {
      tl.fromTo(infoRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' },
        '-=0.8'
      );
    }

    if (headingRef.current) {
      tl.fromTo(headingRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.8'
      );
    }

    if (formRef.current) {
      tl.fromTo(formRef.current,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const adminRoles = ['admin', 'super_admin', 'college_admin', 'company_admin'];
      if (adminRoles.includes(res.data.user.role)) {
        setError('Admin accounts must use the dedicated Admin Portal.');
        // Remove the invalid session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }
      
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
      gsap.fromTo(formRef.current,
        { x: -8 },
        { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex overflow-hidden">
      
      {/* Left Column: Branding / Info (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-white/5">
        
        {/* Animated Background */}
        <div ref={bgRef} className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-[2px]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-20"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop")',
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
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-300 text-xs font-semibold tracking-wide uppercase">Student Growth OS</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-[1.1] mb-6">
            Accelerate your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#a78bfa]">career growth</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Join thousands of students discovering elite hackathons, exclusive internships, and personalized mentorship — all in one unified ecosystem.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="student" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm font-medium">Over 10,000+ students joined</p>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 relative">
        
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-white font-bold text-lg">Codovate</span>
          </Link>
        </div>

        <div ref={formRef} className="w-full max-w-md">
          <div ref={headingRef} className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 drop-shadow-md">Welcome back</h2>
            <p className="text-gray-400 text-base font-medium tracking-wide">Sign in to your account to continue</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 font-semibold">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="input-glass w-full py-4 px-4 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:text-white transition-colors">Forgot?</Link>
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="input-glass w-full py-4 px-4 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 disabled:opacity-50 mt-2 text-sm font-bold tracking-wide shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-8 relative z-10">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="grid grid-cols-1 gap-4 relative z-10">
              <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-gray-100 rounded-xl transition-all text-sm font-bold text-gray-900 shadow-xl">
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:text-primary font-bold transition-colors">Create one</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link to="/admin-login" className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
              <span>🛡️</span>
              Access Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;