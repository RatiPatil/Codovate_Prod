import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';

// Screen 10: AI Workspace Generation
export const Step10AIGeneration = ({ onComplete }) => {
  const listRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
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
    }, containerRef);
    return () => ctx.revert();
  }, [onComplete]);

  const tasks = [
    'Analyzing your profile...',
    '✓ Career Goal',
    '✓ Skills',
    '✓ Experience',
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
      <div ref={listRef} className="space-y-3 text-left w-full max-w-xs relative z-10 bg-[#0a0a0a]/80 backdrop-blur-sm p-5 rounded-xl border border-white/5">
        {tasks.map((t, i) => {
          const isSubtask = t.startsWith('✓');
          return (
            <div key={i} className={`flex items-center gap-3 opacity-0 -translate-x-4 ${isSubtask ? 'pl-6' : ''}`} style={{ transform: 'translateX(-16px)' }}>
              {!isSubtask && (
                <div className="check-icon w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 scale-0 opacity-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className={`${isSubtask ? 'text-gray-400 text-xs' : 'text-gray-200 font-medium text-sm'}`}>{t}</span>
            </div>
          );
        })}
      </div>
      <p className="ai-almost text-primary font-semibold mt-8 text-sm relative z-10">Almost Ready...</p>
    </div>
  );
};

// Screen 11: Success Screen
export const Step11Success = ({ data, onFinish }) => {
  const navigate = require('react-router-dom').useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".success-card", { scale: 0.9, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
      
      // Count up animation for Profile Completion
      gsap.to({ val: 0 }, {
        val: 68,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function() {
          const el = document.querySelector('.completion-stat');
          if (el) el.innerText = Math.round(this.targets()[0].val) + '%';
        }
      });
    });

    // Confetti
    const duration = 3000;
    const end = Date.now() + duration;

    let rafId;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2015FF', '#4ade80', '#c084fc'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2015FF', '#4ade80', '#c084fc'] });
      if (Date.now() < end) rafId = requestAnimationFrame(frame);
    }());

    return () => {
      ctx.revert();
      if (rafId) cancelAnimationFrame(rafId);
    };
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
      <h1 className="text-3xl font-bold text-white mb-2">Welcome {data.full_name?.split(' ')[0] || 'Student'}!</h1>
      <p className="text-gray-400 mb-8">Your Career Workspace is Ready.</p>

      <div className="success-card w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-8 space-y-4">
        <div className="flex flex-col border-b border-white/5 pb-4">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Career Goal</span>
          <span className="text-white font-bold text-base">{data.career_goal || 'Backend Developer'}</span>
        </div>
        <div className="flex flex-col border-b border-white/5 pb-4">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Current Skill Level</span>
          <span className="text-white font-bold text-base">{data.experience_level || 'Intermediate'}</span>
        </div>
        <div className="flex flex-col border-b border-white/5 pb-4">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Placement Target</span>
          <span className="text-white font-bold text-base">{data.placement_goal || '6 Months'}</span>
        </div>
        <div className="flex flex-col border-b border-white/5 pb-4">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Current Profile Score</span>
          <span className="completion-stat text-primary font-black text-2xl">0%</span>
        </div>
        <div className="flex flex-col pt-2">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">Today's Mission</span>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-primary font-bold text-lg">✓</span>
              <span className="text-white text-sm font-medium">{todaysGoal}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-primary font-bold text-lg">✓</span>
              <span className="text-white text-sm font-medium">Upload Resume</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-primary font-bold text-lg">✓</span>
              <span className="text-white text-sm font-medium">Apply to one Internship</span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onFinish} className="bg-primary hover:bg-primary-hover text-white font-bold py-4 px-12 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 w-full sm:w-auto">
        Explore Dashboard
      </button>
    </div>
  );
};
