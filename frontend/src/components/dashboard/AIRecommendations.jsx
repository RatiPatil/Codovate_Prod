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
    <div className="w-full relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">AI Recommendations</h2>
            <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/30 tracking-widest animate-pulse">
              Smart
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-2 font-medium">Curated specifically for your career goals.</p>
        </div>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div 
              key={rec.id} 
              className="rec-card group relative glass-panel border border-white/5 rounded-[1.5rem] p-6 md:p-8 overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(32,21,255,0.15)] hover:-translate-y-1"
            >
              {/* Subtle AI Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                      {rec.type === 'job' ? '🏢' : 
                       rec.type === 'learning' ? '📚' : 
                       rec.type === 'project' ? '💻' :
                       rec.type === 'mentor' ? '👨‍🏫' :
                       rec.type === 'team' ? '🤝' : '🎯'}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-widest mb-1.5 inline-block">{rec.type}</span>
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary-light transition-colors">{rec.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-6 font-medium">
                    {rec.description || 'This opportunity aligns perfectly with your current skill level and roadmap progress.'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto border-t border-white/10 pt-5">
                  <div className="flex flex-wrap gap-2">
                    {rec.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold text-gray-300 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link 
                    to={rec.linkUrl || `/opportunities/${rec.id}`} 
                    className="flex items-center gap-2 text-sm font-black text-primary group-hover:text-primary-light transition-colors bg-primary/10 px-4 py-2 rounded-xl"
                  >
                    View
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rec-card col-span-1 md:col-span-2 glass-panel border border-white/5 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-inner">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
               <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
               <span className="text-4xl relative z-10">🤖</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Analyzing your profile...</h3>
            <p className="text-gray-400 text-sm max-w-md mb-8 font-medium">
              Complete your profile and learning roadmap to receive highly personalized opportunities and mentorship recommendations tailored just for you.
            </p>
            <Link to="/profile" className="relative overflow-hidden group/btn px-8 py-3.5 bg-primary text-white font-bold rounded-xl shadow-[0_0_20px_rgba(32,21,255,0.3)] hover:shadow-[0_0_30px_rgba(32,21,255,0.5)] hover:-translate-y-0.5 transition-all duration-300">
              <span className="relative z-10">Complete Profile</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
