import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

const PlacementReadinessWidget = ({ readiness }) => {
  const containerRef = useRef(null);
  const circleRef = useRef(null);

  const score = readiness?.readinessScore || readiness?.score || 0;
  const details = readiness?.details || { codingScore: 0, assessmentScore: 0, resumeScore: 0, interviewScore: 0 };
  const improvements = readiness?.improvements || [];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion && containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
    
    // Animate the circle dashoffset
    if (!prefersReducedMotion && circleRef.current) {
      const radius = 45;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (score / 100) * circumference;
      
      gsap.fromTo(circleRef.current,
        { strokeDashoffset: circumference },
        { strokeDashoffset: offset, duration: 1.5, ease: 'power2.out', delay: 0.3 }
      );
    }
  }, [score]);

  // SVG parameters
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div ref={containerRef} className="w-full relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Placement Readiness
            {score >= 80 && <span className="text-2xl animate-pulse">🔥</span>}
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium">Based on real metrics across your profile, learning, and projects.</p>
        </div>
      </div>

      <div className="glass-panel p-8 md:p-10 rounded-[2rem] border-white/5 flex flex-col md:flex-row items-center gap-10 md:gap-16 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 relative overflow-hidden group/card shadow-xl hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] hover:-translate-y-1">
        {/* Background glow based on score */}
        <div className={`absolute -right-20 -top-20 w-72 h-72 rounded-full blur-[120px] opacity-20 pointer-events-none transition-all duration-1000 group-hover/card:opacity-30 ${
          score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
        }`} />

        {/* Circular Progress */}
        <div className="relative flex-shrink-0 flex items-center justify-center group-hover/card:scale-105 transition-transform duration-500">
          <svg className="w-36 h-36 md:w-44 md:h-44 transform -rotate-90">
            <circle
              className="text-white/5"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50%"
              cy="50%"
            />
            <circle
              ref={circleRef}
              className={`transition-colors duration-500 ${
                score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50%"
              cy="50%"
              style={{ filter: `drop-shadow(0 0 12px ${score >= 80 ? 'rgba(34,197,94,0.6)' : score >= 50 ? 'rgba(234,179,8,0.6)' : 'rgba(239,68,68,0.6)'})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-md">{score}%</span>
          </div>
        </div>

        {/* Breakdown insights */}
        <div className="flex-1 w-full relative z-10">
          <h3 className="text-xl font-bold text-white mb-5 border-b border-white/10 pb-3 flex items-center gap-2">
            <span>Readiness Breakdown</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-2" />
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Coding Stats</div>
              <div className="text-2xl font-black text-blue-400 drop-shadow-md">{Math.round(details.codingScore)} <span className="text-xs text-gray-500 font-medium">/ 25</span></div>
            </div>
            <div className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Assessments</div>
              <div className="text-2xl font-black text-purple-400 drop-shadow-md">{Math.round(details.assessmentScore)} <span className="text-xs text-gray-500 font-medium">/ 25</span></div>
            </div>
            <div className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Resume Score</div>
              <div className="text-2xl font-black text-emerald-400 drop-shadow-md">{Math.round(details.resumeScore)} <span className="text-xs text-gray-500 font-medium">/ 25</span></div>
            </div>
            <div className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Interviews</div>
              <div className="text-2xl font-black text-orange-400 drop-shadow-md">{Math.round(details.interviewScore)} <span className="text-xs text-gray-500 font-medium">/ 25</span></div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Link to="/placement" className="relative overflow-hidden group/btn px-6 py-3 bg-primary text-white border border-primary/50 rounded-xl hover:shadow-[0_0_20px_rgba(32,21,255,0.4)] font-bold text-sm transition-all duration-300 hover:-translate-y-0.5">
              <span className="relative z-10">Improve Scores</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementReadinessWidget;
