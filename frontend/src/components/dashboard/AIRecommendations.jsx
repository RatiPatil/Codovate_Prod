import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

const AIRecommendations = ({ recommendations }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && containerRef.current) {
      gsap.fromTo(containerRef.current.querySelectorAll('.rec-card'),
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.2)', delay: 0.4 }
      );
    }
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">AI Recommendations</h2>
            <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/30 tracking-widest">
              Smart
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Curated specifically for your career goals.</p>
        </div>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div 
              key={rec.id} 
              className="rec-card group relative bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden hover:border-primary/50 transition-colors"
            >
              {/* Subtle AI Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {rec.type === 'job' ? '🏢' : '🎯'}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{rec.company || 'Recommendation'}</span>
                      <h3 className="text-lg font-bold text-white leading-tight">{rec.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-6">
                    {rec.description || 'This opportunity aligns perfectly with your current skill level and roadmap progress.'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    {rec.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link 
                    to={`/opportunities/${rec.id}`} 
                    className="flex items-center gap-2 text-sm font-bold text-primary group-hover:text-primary-light transition-colors"
                  >
                    View Details
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rec-card col-span-1 md:col-span-2 bg-[#0a0a0c] border border-white/5 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-4 opacity-50">🤖</span>
            <h3 className="text-lg font-bold text-white mb-2">Analyzing your profile...</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-6">
              Complete your profile and learning roadmap to receive highly personalized opportunities and mentorship recommendations.
            </p>
            <Link to="/profile" className="btn-primary text-sm font-bold px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(32,21,255,0.2)]">
              Complete Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
