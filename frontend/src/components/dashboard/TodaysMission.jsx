import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import api from '../../api/axios';

const TodaysMission = ({ mission, onMissionComplete }) => {
  const containerRef = useRef(null);
  const [tasks, setTasks] = useState(mission?.tasks || []);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (mission?.tasks) {
      setTasks(mission.tasks);
    }
  }, [mission]);

  const handleComplete = async (task) => {
    if (task.completed || loadingId) return;
    setLoadingId(task.id);
    
    try {
      const res = await api.post('/students/mission/complete', { taskId: task.id });
      setTasks(res.data.mission.tasks);
      
      // Animate checkmark
      gsap.fromTo(`.check-${task.id}`, 
        { scale: 0, rotation: -45, opacity: 0 }, 
        { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
      
      // Call parent to update XP
      if (onMissionComplete) {
        onMissionComplete(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const totalTime = tasks.length * 15; // Rough estimate
  const totalXP = tasks.reduce((acc, curr) => acc + curr.xp, 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 transition-all duration-500" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Today's Mission</h2>
          <div className="flex gap-4 text-xs font-semibold">
            <span className="text-gray-400">⏱️ Est. {totalTime} Minutes</span>
            <span className="text-primary">🏆 Reward +{totalXP} XP</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => handleComplete(task)}
            disabled={task.completed || loadingId === task.id}
            className={`w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              task.completed 
                ? 'bg-primary/10 border-primary/30 opacity-70' 
                : 'bg-black/40 border-white/10 hover:border-primary/50 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                task.completed ? 'bg-primary border-primary text-white' : 'border-gray-600'
              }`}>
                {task.completed && (
                  <span className={`check-${task.id}`}>✓</span>
                )}
                {loadingId === task.id && (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <span className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                {task.title}
              </span>
            </div>
            <span className="text-primary font-bold text-sm">+{task.xp} XP</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TodaysMission;
