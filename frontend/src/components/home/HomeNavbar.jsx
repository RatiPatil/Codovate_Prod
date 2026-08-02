import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Menu, X } from 'lucide-react';

const HomeNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    if (user) {
      navigate(path);
    } else {
      if (path === '/') {
        navigate('/');
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-gray-200/60 shadow-sm py-3'
          : 'bg-white/60 backdrop-blur-md border-b border-transparent py-4.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Codovate Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Logo size="md" />
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="text-slate-900 font-semibold hover:text-blue-600 transition-colors">
            Home
          </Link>
          <button onClick={() => handleNavClick('/opportunities')} className="hover:text-blue-600 transition-colors">
            Opportunities
          </button>
          <button onClick={() => handleNavClick('/teams')} className="hover:text-blue-600 transition-colors">
            Teams
          </button>
          <button onClick={() => handleNavClick('/learning')} className="hover:text-blue-600 transition-colors">
            Learning
          </button>
          <button onClick={() => handleNavClick('/resume-builder')} className="hover:text-blue-600 transition-colors">
            Resume Builder
          </button>
        </nav>

        {/* Right CTA / Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-blue-600 rounded-lg"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-900">
            Home
          </Link>
          <button onClick={() => handleNavClick('/opportunities')} className="block w-full text-left py-2 text-sm font-medium text-slate-600">
            Opportunities
          </button>
          <button onClick={() => handleNavClick('/teams')} className="block w-full text-left py-2 text-sm font-medium text-slate-600">
            Teams
          </button>
          <button onClick={() => handleNavClick('/learning')} className="block w-full text-left py-2 text-sm font-medium text-slate-600">
            Learning
          </button>
          <button onClick={() => handleNavClick('/resume-builder')} className="block w-full text-left py-2 text-sm font-medium text-slate-600">
            Resume Builder
          </button>
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-center text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-center text-slate-700 border border-slate-200 bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-center text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
                >
                  Get Started Free →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;
