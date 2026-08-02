import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const HomeFooter = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-100">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Helping students learn, collaborate, build, and grow into real-world career opportunities.
            </p>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-sm font-medium">
                <li>
                  <Link to="/opportunities" className="hover:text-blue-600 transition-colors">Opportunities</Link>
                </li>
                <li>
                  <Link to="/teams" className="hover:text-blue-600 transition-colors">Teams</Link>
                </li>
                <li>
                  <Link to="/learning" className="hover:text-blue-600 transition-colors">Learning</Link>
                </li>
                <li>
                  <Link to="/resume-builder" className="hover:text-blue-600 transition-colors">Resume Builder</Link>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account</h4>
              <ul className="space-y-2 text-sm font-medium">
                <li>
                  <Link to="/login" className="hover:text-blue-600 transition-colors">Sign In</Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-blue-600 transition-colors">Create Account</Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Student Dashboard</Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Legal & Policies</h4>
              <ul className="space-y-2 text-sm font-medium">
                <li>
                  <Link to="/policies" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/policies" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p>© 2026 Codovate Technologies. All rights reserved.</p>
          <p>Designed & Built for Students</p>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
