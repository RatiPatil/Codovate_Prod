import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

const PlacementReadinessWidget = ({ readiness }) => {
  const containerRef = useRef(null);
  const circleRef = useRef(null);

  const score = readiness?.score || 0;
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
    <div ref={containerRef} className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Placement Readiness
            {score >= 80 && <span className="text-xl">🔥</span>}
          </h2>
          <p className="text-gray-400 text-sm mt-1">Based on real metrics across your profile, learning, and projects.</p>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-8 md:gap-12 hover:bg-white/[0.03] transition-colors relative overflow-hidden">
        {/* Background glow based on score */}
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${
          score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
        }`} />

        {/* Circular Progress */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
            <circle
              className="text-white/5"
              strokeWidth="8"
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
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50%"
              cy="50%"
              style={{ filter: `drop-shadow(0 0 8px ${score >= 80 ? 'rgba(34,197,94,0.5)' : score >= 50 ? 'rgba(234,179,8,0.5)' : 'rgba(239,68,68,0.5)'})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl md:text-4xl font-black text-white">{score}%</span>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="flex-1 w-full relative z-10">
          <h3 className="text-lg font-bold text-white mb-4">Areas to Improve</h3>
          {improvements.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {improvements.map((item, idx) => (
                <div 
                  key={idx}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 flex items-center gap-2 hover:border-primary/50 hover:bg-white/10 transition-colors cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center gap-2 w-fit">
              <span>🚀</span> You are highly prepared! Keep applying.
            </div>
          )}
          
          <div className="mt-6">
            <Link to="/roadmap" className="text-primary hover:text-primary-light font-bold text-sm flex items-center gap-1 transition-colors w-fit">
              Continue your roadmap to boost your score 
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementReadinessWidget;
