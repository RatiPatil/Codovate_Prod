import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';

const TodaysFocusWidget = ({ mission }) => {
  const [localMission, setLocalMission] = useState(mission);
  const [loadingTask, setLoadingTask] = useState(null);
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

  if (!localMission || !localMission.tasks || localMission.tasks.length === 0) return null;

  const handleComplete = async (taskId) => {
    try {
      setLoadingTask(taskId);
      const res = await api.post('/students/mission/complete', { taskId });
      setLocalMission(res.data.mission);
      showAlert(`+${res.data.awarded} XP Earned!`, 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to complete task');
    } finally {
      setLoadingTask(null);
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'profile': return '👤';
      case 'learning': return '📚';
      case 'action': return '🚀';
      default: return '⚡';
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Today's Focus</h2>
          <p className="text-gray-400 text-sm mt-1">Complete these tasks to move closer to your goal.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</span>
          <span className="text-sm font-bold text-white">
            {localMission.tasks.filter(t => t.completed).length}/{localMission.tasks.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localMission.tasks.map((task) => (
          <div 
            key={task.id} 
            className={`task-item relative p-6 rounded-2xl border transition-all duration-300 ${
              task.completed 
                ? 'bg-green-500/10 border-green-500/20 opacity-70' 
                : 'bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getTaskIcon(task.type)}</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    +{task.xp} XP
                  </span>
                </div>
                <h3 className={`text-lg font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                  {task.title}
                </h3>
              </div>
              
              <button
                onClick={() => handleComplete(task.id)}
                disabled={task.completed || loadingTask === task.id}
                className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.completed 
                    ? 'border-green-500 bg-green-500 text-black'
                    : 'border-white/20 hover:border-primary text-transparent hover:bg-primary/20 hover:text-primary'
                }`}
              >
                {loadingTask === task.id ? (
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodaysFocusWidget;
