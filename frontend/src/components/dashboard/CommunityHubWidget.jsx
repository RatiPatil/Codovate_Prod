import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Future dates (e.g. upcoming mentor session)
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 86400) return 'in ' + Math.floor(absDiff / 3600) + 'h';
    return 'in ' + Math.floor(absDiff / 86400) + 'd';
  }

  // Past dates
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + 'm ago';
  if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + 'h ago';
  return Math.floor(diffInSeconds / 86400) + 'd ago';
};

const CommunityHubWidget = ({ updates }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && containerRef.current) {
      gsap.fromTo(containerRef.current.querySelectorAll('.community-item'),
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, []);

  if (!updates || updates.length === 0) return null;

  return (
    <div className="w-full relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Community Hub</h2>
            <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/30 tracking-widest">
              Live
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-2 font-medium">Your latest team, mentor, and event updates.</p>
        </div>
      </div>

      <div ref={containerRef} className="glass-panel border border-white/5 rounded-[1.5rem] p-6 md:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-4 relative z-10">
          {updates.map((update, idx) => (
            <Link 
              to={update.linkUrl} 
              key={update.id || idx}
              className="community-item block group relative bg-[#0a0a0f]/50 border border-white/5 rounded-2xl p-4 hover:border-primary/40 hover:bg-white/[0.02] transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-2xl group-hover:scale-110 transition-transform shadow-inner">
                  {update.icon || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-white font-bold truncate group-hover:text-primary-light transition-colors">
                      {update.title}
                    </h4>
                    {update.timestamp && (
                      <span className="text-xs font-medium text-gray-500 shrink-0">
                        {timeAgo(update.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {update.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityHubWidget;
