import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, ChevronDown, Menu, X, ChevronRight } from 'lucide-react';
import Logo from '../common/Logo';

const StickyNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark'
      );
    }
    return false;
  });
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    if (nextIsDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    {
      name: 'Courses',
      href: '#learning',
      hasDropdown: true,
      subItems: [
        { name: 'Data Structures & Algorithms', href: '#learning' },
        { name: 'Full-Stack Web Development', href: '#learning' },
        { name: 'AI & Machine Learning', href: '#learning' },
        { name: 'System Design Masterclass', href: '#learning' },
      ],
    },
    {
      name: 'Explore',
      href: '#orbit-core',
      hasDropdown: true,
      subItems: [
        { name: 'AI Career Roadmap', href: '#roadmap' },
        { name: 'Production Project Hub', href: '#projects' },
        { name: 'Open Access Library', href: '#resources' },
        { name: 'Mentor Network', href: '#mentors' },
      ],
    },
    {
      name: 'Practice',
      href: '#practice',
      hasDropdown: true,
      subItems: [
        { name: 'Interactive Browser IDE', href: '#practice' },
        { name: 'Skill Diagnostic Tests', href: '#features' },
        { name: 'AI Mock Interviews', href: '#features' },
        { name: 'Developer Challenges', href: '#resources' },
      ],
    },
    {
      name: 'Pricing',
      href: '#faq',
      hasDropdown: false,
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out flex justify-center ${
          isScrolled ? 'py-2 px-4 sm:px-8' : 'py-3.5 px-6 sm:px-12'
        }`}
      >
        <div
          className={`w-full max-w-7xl transition-all duration-300 flex items-center justify-between px-6 py-2.5 ${
            isScrolled
              ? 'bg-white/90 dark:bg-[#0E121E]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-full py-2'
              : 'bg-white/70 dark:bg-[#080A12]/70 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/50 rounded-full shadow-xs'
          }`}
        >
          {/* LEFT: Codovate Logo (Automatically switches light/dark logo variant) */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Logo variant={isDark ? 'dark' : 'light'} size="xs" />
          </Link>

          {/* CENTER: Navigation items */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative group"
                onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={link.href}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
                >
                  <span>{link.name}</span>
                  {link.hasDropdown && (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </a>

                {/* Dropdown Menu */}
                {link.hasDropdown && activeDropdown === link.name && (
                  <div className="absolute top-full left-0 mt-2 w-56 p-2 bg-white dark:bg-[#111522] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-1 animate-fadeIn">
                    {link.subItems.map((sub, idx) => (
                      <a
                        key={idx}
                        href={sub.href}
                        className="block px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* RIGHT: Sun/Moon Theme Toggle + Gradient Get Started Button */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-md pt-20 px-6 pb-8">
          <div className="bg-white dark:bg-[#111522] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <Logo size="xs" variant={isDark ? 'dark' : 'light'} />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyNavbar;
