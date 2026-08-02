import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-tr from-blue-50/90 via-indigo-50/70 to-purple-50/90 border border-blue-200/60 p-10 md:p-16 text-center space-y-6 overflow-hidden shadow-xl shadow-blue-500/5">
          
          {/* Subtle background blur shapes */}
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-200/40 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-200/40 rounded-full blur-2xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <Sparkles size={14} className="text-blue-600 animate-pulse" />
            <span>Start Your College-to-Career Journey Today</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 max-w-2xl mx-auto leading-tight">
            Ready to Build What's Next?
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Create your Codovate profile and start exploring opportunities, teams, learning, and career tools.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/opportunities"
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-center"
            >
              Explore Opportunities
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
