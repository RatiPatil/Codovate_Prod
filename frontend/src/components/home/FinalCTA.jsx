import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-2xl overflow-hidden text-center space-y-6">
          {/* Ambient Glow Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25)_0%,transparent_60%)] pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Ready to Transform Your Career?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Your Software Career Starts With What You Build Today.
          </h2>

          <p className="text-indigo-100 text-base max-w-xl mx-auto leading-relaxed">
            Join Codovate to access structured learning paths, production project workspaces, and AI career guidance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-900 font-extrabold text-sm hover:bg-slate-50 transition-all duration-200 shadow-xl hover:-translate-y-0.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-indigo-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Structured Path • Production Projects • Placement Prep</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
