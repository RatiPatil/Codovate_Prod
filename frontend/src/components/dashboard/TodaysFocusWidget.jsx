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
    <div ref={containerRef} className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Today's Focus</h2>
          <p className="text-gray-400 text-sm mt-1">Complete these tasks to move closer to your goal.</p>
        </div>
        {mission?.estimated_time && (
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
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
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center flex flex-col items-center">
          <span className="text-4xl mb-4">🎉</span>
          <h3 className="text-xl font-bold text-white mb-2">You're all caught up!</h3>
          <p className="text-gray-400 text-sm max-w-sm">
            You've completed your profile, uploaded a resume, and applied to opportunities. Great job! Keep exploring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Link 
              key={task.id} 
              to={task.actionUrl || '/'}
              className="task-item group relative p-6 rounded-2xl border transition-all duration-300 bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10 block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getTaskIcon(task.type)}</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Action Required
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors">
                    {task.title}
                  </h3>
                </div>
                
                <div className="shrink-0 w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center transition-all group-hover:border-primary text-transparent group-hover:text-primary">
                  <svg className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
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
