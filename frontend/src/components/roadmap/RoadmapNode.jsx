import React from 'react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  completed: 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] border-green-400',
  in_progress: 'bg-primary shadow-[0_0_15px_rgba(32,21,255,0.5)] border-primary-light',
  pending: 'bg-white/10 border-white/20'
};

const RoadmapNode = ({ step, index, isLast }) => {
  const navigate = useNavigate();

  const isCompleted = step.status === 'completed';
  const nodeColor = statusColors[step.status] || statusColors.pending;

  // Derive progress visually if we have content
  const hasContent = !!step.content;
  const content = step.content || {};
  const totalAssignments = content.assignments ? content.assignments.length : 0;
  const completedAssignments = content.assignments ? content.assignments.filter(a => a.completed).length : 0;
  const quizPassed = content.quizPassed;
  
  // High-level old tasks fallback if content not generated yet
  const oldTotalTasks = step.tasks ? step.tasks.length : 0;
  const oldCompletedTasks = step.tasks ? step.tasks.filter(t => t.completed).length : 0;

  const getProgressLabel = () => {
    if (hasContent) {
      if (quizPassed && completedAssignments === totalAssignments) return "Completed";
      if (!quizPassed && totalAssignments === 0) return "In Progress";
      return `${completedAssignments}/${totalAssignments} Assignments`;
    }
    if (oldTotalTasks > 0) return `${oldCompletedTasks}/${oldTotalTasks} Tasks`;
    return step.status.replace('_', ' ');
  };

  const progressPercent = hasContent 
    ? (totalAssignments === 0 ? (quizPassed ? 100 : 50) : ((completedAssignments + (quizPassed?1:0)) / (totalAssignments+1)) * 100)
    : (oldTotalTasks === 0 ? (isCompleted ? 100 : 0) : (oldCompletedTasks / oldTotalTasks) * 100);

  return (
    <div className="relative mb-12 last:mb-0">
      {/* Node Circle */}
      <div 
        className={`absolute -left-[30px] md:-left-[26px] w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-300 ${nodeColor}`}
      >
        {isCompleted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>

      {/* Content Card */}
      <div 
        className={`ml-6 md:ml-10 glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
          step.status === 'in_progress' ? 'border-primary/30 shadow-[0_0_30px_rgba(32,21,255,0.1)]' : 'border-white/5'
        }`}
      >
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Step {index + 1}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                step.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-400' :
                step.difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {step.difficulty || 'Unknown'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">
                ⏱️ {step.estimated_time || 'N/A'}
              </span>
              {hasContent && quizPassed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-1">
                  ⭐ Quiz Passed
                </span>
              )}
            </div>
            <h3 className={`text-2xl font-black mb-2 ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
              {step.title}
            </h3>
            <p className="text-sm text-gray-400 mb-4">Master this topic through detailed notes, interactive quizzes, and hands-on assignments.</p>
            
            <button 
              onClick={() => navigate(`/roadmap/module/${step.id}`)}
              className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-light text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(32,21,255,0.3)] hover:scale-105 active:scale-95"
            >
              Start Module 🚀
            </button>
          </div>

          <div className="flex flex-col items-end shrink-0 min-w-[120px]">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">{getProgressLabel()}</p>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapNode;
