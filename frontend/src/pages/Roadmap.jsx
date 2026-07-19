import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../api/axios';
import RoadmapTimeline from '../components/roadmap/RoadmapTimeline';

const Roadmap = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const headerRef = useRef(null);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roadmap');
      setRoadmap(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      const res = await api.post('/roadmap/generate');
      setRoadmap(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate roadmap. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleTaskToggle = async (stepId, taskId, completed) => {
    // Optimistic update
    setRoadmap(prev => {
      if (!prev) return prev;
      const newSteps = prev.steps.map(step => {
        let stepCompletedTasks = 0;
        const newTasks = step.tasks.map(t => {
          const isTarget = step.id === stepId && t.id === taskId;
          const taskCompleted = isTarget ? completed : t.completed;
          if (taskCompleted) stepCompletedTasks++;
          return { ...t, completed: taskCompleted };
        });
        
        let stepStatus = "pending";
        if (stepCompletedTasks > 0) stepStatus = "in_progress";
        if (stepCompletedTasks === newTasks.length && newTasks.length > 0) stepStatus = "completed";
        
        return { ...step, tasks: newTasks, status: stepStatus };
      });
      
      let totalTasks = 0;
      let completedTotal = 0;
      newSteps.forEach(s => {
        totalTasks += s.tasks.length;
        completedTotal += s.tasks.filter(t => t.completed).length;
      });
      const overall = totalTasks === 0 ? 0 : Math.round((completedTotal / totalTasks) * 100);
      
      return { ...prev, steps: newSteps, overall_progress: overall };
    });

    try {
      await api.put('/roadmap/roadmap-progress', { stepId, taskId, completed });
    } catch (err) {
      console.error('Failed to save task status:', err);
      // Revert if failed (simple re-fetch for now)
      fetchRoadmap();
    }
  };

  useEffect(() => {
    if (headerRef.current && !loading && !generating) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [loading, generating, roadmap]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-5xl mx-auto flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-5xl mx-auto pb-32">
      <div ref={headerRef} className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">AI Career Roadmap</h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
          Your personalized, step-by-step path to achieving your career goals.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 font-semibold">
          {error}
        </div>
      )}

      {generating ? (
        <div className="glass-panel p-16 rounded-3xl text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">✨</div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Unique Path...</h2>
            <p className="text-gray-400">Our AI is analyzing your skills, goals, and interests to craft the perfect roadmap.</p>
          </div>
        </div>
      ) : !roadmap ? (
        <div className="glass-panel p-12 md:p-16 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(32,21,255,0.2)]">
              🗺️
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Roadmap Found</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              You haven't generated an AI career roadmap yet. Let Codovate's intelligent engine chart out your path to success based on your profile!
            </p>
            <button 
              onClick={handleGenerate}
              className="btn-primary py-4 px-8 rounded-xl text-lg flex items-center gap-3 font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(32,21,255,0.3)]"
            >
              <span>✨</span> Generate My AI Roadmap
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Target: {roadmap.goal}</h2>
              <p className="text-sm text-gray-400">
                Generated {roadmap.generated_at ? new Date(roadmap.generated_at).toLocaleDateString() : 'recently'}
              </p>
            </div>
            <div className="flex-1 max-w-xs w-full text-right">
              <div className="flex justify-between text-sm mb-2 font-bold">
                <span className="text-gray-300">Overall Progress</span>
                <span className="text-primary">{roadmap.overall_progress || 0}%</span>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(32,21,255,0.5)]" 
                  style={{ width: `${roadmap.overall_progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          <RoadmapTimeline steps={roadmap.steps} onTaskToggle={handleTaskToggle} />
        </div>
      )}
    </div>
  );
};

export default Roadmap;
