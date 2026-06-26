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

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed.');
    }
  };

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(bgRef.current,
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
    );

    if (infoRef.current) {
      tl.fromTo(infoRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' },
        '-=0.8'
      );
    }

    tl.fromTo(formRef.current,
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    );
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
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
                  className="input-glass w-full py-4 px-4 text-sm"
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
                  className="input-glass w-full py-4 px-4 text-sm"
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
              <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-semibold text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
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