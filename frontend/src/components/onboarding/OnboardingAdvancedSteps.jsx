import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';

// Screen 10: AI Workspace Generation
export const Step10AIGeneration = ({ onComplete }) => {
  const listRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const items = listRef.current.children;
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 1000);
      }
    });

    // Particle Animation
    gsap.utils.toArray(".ai-particle").forEach(particle => {
      gsap.fromTo(particle, 
        { x: 0, y: 0, opacity: 0, scale: 0 },
        {
          x: () => (Math.random() * 300 - 150),
          y: () => (Math.random() * 300 - 150),
          opacity: () => Math.random() * 0.6 + 0.2,
          scale: () => Math.random() * 2 + 0.5,
          duration: () => Math.random() * 2 + 1.5,
          ease: "power2.out",
          repeat: -1,
          yoyo: true,
          delay: () => Math.random() * 2
        }
      );
    });

    tl.fromTo(".ai-title", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 })
      .fromTo(".ai-spinner", { scale: 0, rotation: 0 }, { scale: 1, rotation: 360, duration: 0.8, ease: "back.out(1.5)" }, "-=0.2");

    Array.from(items).forEach((item, i) => {
      tl.to(item, { opacity: 1, x: 0, duration: 0.4 }, `+=${i === 0 ? 0 : 0.4}`);
      tl.to(item.querySelector('.check-icon'), { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(2)" });
    });

    // Make the infinite animation separate from the main timeline so onComplete fires
    gsap.fromTo(".ai-almost", { opacity: 0 }, { opacity: 1, duration: 0.5, yoyo: true, repeat: -1, delay: tl.duration() + 0.5 });
  }, [onComplete]);

  const tasks = [
    'Analyzing your profile...',
    'Generating AI Career Roadmap...',
    'Generating Dashboard...',
    'Finding Mentors...',
    'Finding Opportunities...',
    'Calculating Placement Readiness...',
    'Preparing Recommendations...',
    'Building Portfolio...',
    'Creating Daily Goals...',
    'Generating Weekly Mission...'
  ];

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-12 relative w-full overflow-hidden">
      {/* Particles Container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="ai-particle absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(32,21,255,0.8)]" />
        ))}
      </div>

      <div className="ai-spinner w-16 h-16 rounded-full border-4 border-white/10 border-t-primary mb-6 animate-spin relative z-10 bg-[#0a0a0a] shadow-[0_0_30px_rgba(32,21,255,0.3)]" />
      <h2 className="ai-title text-2xl font-bold text-white mb-8 relative z-10">🧠 Building Your AI Career Workspace</h2>
      <div ref={listRef} className="space-y-4 text-left w-full max-w-xs relative z-10 bg-[#0a0a0a]/80 backdrop-blur-sm p-4 rounded-xl border border-white/5">
        {tasks.map((t, i) => (
          <div key={i} className="flex items-center gap-3 opacity-0 -translate-x-4" style={{ transform: 'translateX(-16px)' }}>
            <div className="check-icon w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 scale-0 opacity-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-gray-300 font-medium text-sm">{t}</span>
          </div>
        ))}
      </div>
      <p className="ai-almost text-primary font-semibold mt-8 text-sm relative z-10">Almost Ready...</p>
    </div>
  );
};

// Screen 11: Success Screen
export const Step11Success = ({ data, onFinish }) => {
  const navigate = require('react-router-dom').useNavigate();

  useEffect(() => {
    gsap.fromTo(".success-card", { scale: 0.9, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
    
    // Confetti
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2015FF', '#4ade80', '#c084fc'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2015FF', '#4ade80', '#c084fc'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }, []);

  const firstSkill = data.skills?.[0]?.name || 'Basics';
  const todaysGoal = `Complete ${firstSkill}`;

  const handleReviewProfile = () => {
    onFinish(); // complete onboarding first
    navigate('/profile');
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
        <span className="text-4xl">🎉</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Congratulations {data.full_name?.split(' ')[0]}!</h1>
      <p className="text-gray-400 mb-8">Your personalized workspace is ready.</p>

      <div className="success-card w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-8 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-500 text-sm">Profile Completion</span>
          <span className="text-primary font-bold text-sm">100%</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-500 text-sm">Career Goal</span>
          <span className="text-white font-semibold text-sm">{data.career_goal || 'Not specified'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-500 text-sm">Placement Target</span>
          <span className="text-white font-semibold text-sm">{data.placement_goal || 'Not specified'}</span>
        </div>
        <div className="flex justify-between items-center pb-3">
          <span className="text-gray-500 text-sm">Today's Mission</span>
          <span className="text-primary font-semibold text-sm">{todaysGoal}</span>
        </div>
        <div className="flex justify-between items-center pb-3">
          <span className="text-gray-500 text-sm">Weekly Goal</span>
          <span className="text-white font-semibold text-sm">Apply to 5 Internships</span>
        </div>
        <div className="bg-primary/10 rounded-xl p-4 mt-2 border border-primary/20">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Recommended Learning</p>
          <div className="flex items-center gap-2 text-sm text-white flex-wrap">
            <span className="bg-black/30 px-2 py-1 rounded">{firstSkill}</span>
            <span className="text-gray-500">→</span>
            <span className="bg-black/30 px-2 py-1 rounded">{data.skills?.[1]?.name || 'Advanced'}</span>
            <span className="text-gray-500">→</span>
            <span className="bg-black/30 px-2 py-1 rounded">Projects</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mt-2 border border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs flex items-center gap-1.5"><span className="text-primary">💼</span> Suggested Opportunity</span>
            <span className="text-white font-medium text-xs">{data.career_goal || 'Backend'} Internship</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs flex items-center gap-1.5"><span className="text-primary">🤝</span> Suggested Mentor</span>
            <span className="text-white font-medium text-xs">{firstSkill} Expert</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs flex items-center gap-1.5"><span className="text-primary">👥</span> Suggested Team</span>
            <span className="text-white font-medium text-xs">{data.career_goal?.split(' ')[0] || 'Tech'} Enthusiasts</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <button onClick={onFinish} className="bg-primary hover:bg-primary-hover text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 w-full sm:w-auto">
          Explore Dashboard
        </button>
        <button onClick={handleReviewProfile} className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-10 rounded-xl border border-white/10 transition-all hover:border-white/30 hover:scale-105 w-full sm:w-auto">
          Review Profile
        </button>
      </div>
    </div>
  );
};
