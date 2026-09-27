import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const FooterV2 = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkTheme = () => {
        setIsDark(document.documentElement.classList.contains('dark'));
      };
      checkTheme();
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <footer className="bg-slate-50/80 dark:bg-[#06080F] border-t border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 text-xs relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 sm:gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <Logo size="sm" variant={isDark ? 'dark' : 'light'} />
            </Link>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              India's student career ecosystem combining AI roadmaps, structured computer science learning, production project building, and placement preparation.
            </p>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
              © {new Date().getFullYear()} Codovate Technologies Inc. All rights reserved.
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#learning" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Learning Modules</a></li>
              <li><a href="#projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Project Workspaces</a></li>
              <li><a href="#practice" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Coding Practice</a></li>
              <li><a href="#roadmap" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">AI Career Roadmap</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Solutions</h4>
            <ul className="space-y-2">
              <li><Link to="/opportunities" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Placement Opportunities</Link></li>
              <li><Link to="/resume-review" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">ATS Resume Scoring</Link></li>
              <li><Link to="/mock-interview" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Mock AI Interviews</Link></li>
              <li><a href="#resources" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Open Access Library</a></li>
            </ul>
          </div>

          {/* Portals */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Portals</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Student Login</Link></li>
              <li><Link to="/mentor/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Mentor Portal</Link></li>
              <li><Link to="/recruiter-login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Company Recruiter</Link></li>
              <li><Link to="/admin-login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">College Admin</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterV2;
