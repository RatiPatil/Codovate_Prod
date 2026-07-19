import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

const TodaysFocusWidget = ({ mission }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && containerRef.current) {
      gsap.fromTo(containerRef.current.querySelectorAll('.task-item'),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, []);

  const getTaskIcon = (type) => {
    switch (type) {
      case 'profile': return '👤';
      case 'learning': return '📚';
      case 'action': return '🚀';
      default: return '⚡';
    }
  };

  const tasks = mission?.tasks || [];

  return (
    <div ref={containerRef} className="w-full relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Today's Focus <span className="bg-primary/20 text-primary text-[10px] uppercase px-2 py-0.5 rounded-full border border-primary/30 tracking-widest font-bold">Action Plan</span>
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium">Complete these tasks to move closer to your goal.</p>
        </div>
        {mission?.estimated_time && (
          <div className="flex items-center gap-4 glass-panel border-white/10 px-5 py-2.5 rounded-xl hover:-translate-y-1 transition-transform cursor-default">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">⏱️</span>
              <span className="font-bold text-gray-300">{mission.estimated_time}</span>
            </div>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">✨</span>
              <span className="font-bold text-yellow-400">{mission.reward || '+100 XP'}</span>
            </div>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="glass-panel border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent rounded-3xl p-10 text-center flex flex-col items-center shadow-[0_0_30px_rgba(34,197,94,0.05)]">
          <span className="text-5xl mb-5 animate-bounce">🎉</span>
          <h3 className="text-2xl font-bold text-white mb-2">You're all caught up!</h3>
          <p className="text-gray-400 text-sm max-w-sm font-medium">
            You've completed your profile, uploaded a resume, and applied to opportunities. Great job! Keep exploring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <Link 
              key={task.id} 
              to={task.actionUrl || '/'}
              className="task-item group relative p-6 rounded-[1.5rem] transition-all duration-500 glass-panel hover:bg-white/[0.04] border-white/5 hover:border-primary/50 block overflow-hidden hover:shadow-[0_8px_30px_rgba(32,21,255,0.15)] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl drop-shadow-md">{getTaskIcon(task.type)}</span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Action Required
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors leading-tight">
                    {task.title}
                  </h3>
                </div>
                
                <div className="shrink-0 w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center transition-all duration-500 group-hover:border-primary group-hover:bg-primary/10 text-gray-500 group-hover:text-primary">
                  <svg className="w-5 h-5 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaysFocusWidget;
