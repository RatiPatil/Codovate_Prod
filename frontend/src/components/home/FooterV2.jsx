import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import Logo from '../common/Logo';

const FooterV2 = () => {
  return (
    <footer className="relative z-10 bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Logo responsive variant="dark" size="md" />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Codovate is the AI-powered student career ecosystem designed to help engineering students build production software, master technical interviews, and secure top placements.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <span>Learn • Build • Compete • Grow</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Platform Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/roadmap" className="hover:text-white transition-colors">AI Career Roadmap</Link></li>
              <li><Link to="/coding-practice" className="hover:text-white transition-colors">Coding Practice IDE</Link></li>
              <li><Link to="/projecthub" className="hover:text-white transition-colors">Project Hub</Link></li>
              <li><Link to="/skill-assessments" className="hover:text-white transition-colors">Skill Assessments</Link></li>
              <li><Link to="/resume-builder" className="hover:text-white transition-colors">ATS Resume Builder</Link></li>
              <li><Link to="/mock-interview" className="hover:text-white transition-colors">AI Mock Interviews</Link></li>
            </ul>
          </div>

          {/* Col 3: Learning Paths */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Learning Paths</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/learning" className="hover:text-white transition-colors">Data Structures & Algo</Link></li>
              <li><Link to="/learning" className="hover:text-white transition-colors">Full-Stack Web Dev</Link></li>
              <li><Link to="/learning" className="hover:text-white transition-colors">System Design Masterclass</Link></li>
              <li><Link to="/learning" className="hover:text-white transition-colors">AI & LLM Engineering</Link></li>
              <li><Link to="/learning" className="hover:text-white transition-colors">Core CS (OS, DBMS, CN)</Link></li>
            </ul>
          </div>

          {/* Col 4: Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Portals & Community</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/mentors" className="hover:text-white transition-colors">Mentor Network</Link></li>
              <li><Link to="/community" className="hover:text-white transition-colors">Student Community</Link></li>
              <li><Link to="/admin-login" className="hover:text-white transition-colors">College Admin Portal</Link></li>
              <li><Link to="/recruiter-login" className="hover:text-white transition-colors">Recruiter Portal</Link></li>
              <li><Link to="/mentor/login" className="hover:text-white transition-colors">Mentor Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Codovate. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterV2;
