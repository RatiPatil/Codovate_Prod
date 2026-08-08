import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X, ArrowRight, ChevronRight } from 'lucide-react';
import Logo from '../common/Logo';

const StickyNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Platform', href: '#orbit-core' },
    { name: 'Learning', href: '#learning' },
    { name: 'Mentors', href: '#mentors' },
    { name: 'Resources', href: '#resources' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out flex justify-center ${
          isScrolled ? 'py-3 px-4' : 'py-5 px-6'
        }`}
      >
        <div
          className={`w-full max-w-7xl transition-all duration-500 rounded-full flex items-center justify-between px-5 py-2.5 ${
            isScrolled
              ? 'bg-white/85 backdrop-blur-xl border border-indigo-100/80 shadow-[0_8px_32px_rgba(79,70,229,0.08)] py-2'
              : 'bg-white/40 backdrop-blur-md border border-slate-200/50 shadow-sm'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo responsive variant="light" size="sm" />
            <span className="hidden sm:inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/60">
              AI Core
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/60 p-1 rounded-full border border-slate-200/40">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-3.5 py-1.5 rounded-full transition-all duration-200 hover:bg-white hover:shadow-xs"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3.5 py-2 rounded-full transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-300 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-900/40 backdrop-blur-md pt-24 px-6 pb-8 transition-opacity">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <Logo size="sm" />
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                V2.0 Ecosystem
              </span>
            </div>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Get Started Free</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyNavbar;
