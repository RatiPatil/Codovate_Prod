import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-24 md:py-32 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[36px] overflow-hidden p-8 sm:p-14 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-500/30 text-center space-y-8">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Join 50,000+ Engineering Students</span>
          </div>

          {/* Main Title */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Your Career Starts With What You Build Today.
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Start building your portfolio, mastering algorithms, and preparing for top tech placements on Codovate.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 hover:brightness-110 shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Start Learning Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/learning"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <span>Explore Codovate</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Free Core Access</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>No Credit Card Required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
