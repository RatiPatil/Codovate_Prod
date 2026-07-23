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
          setTimeout(onComplete, 1200);
        }
      });

      // Particle Animation
      gsap.utils.toArray(".ai-particle").forEach(particle => {
        gsap.fromTo(particle, 
          { x: 0, y: 0, opacity: 0, scale: 0 },
          {
            x: () => (Math.random() * 400 - 200),
            y: () => (Math.random() * 400 - 200),
            opacity: () => Math.random() * 0.8 + 0.2,
            scale: () => Math.random() * 2.5 + 0.5,
            duration: () => Math.random() * 2 + 1.5,
            ease: "power2.out",
            repeat: -1,
            yoyo: true,
            delay: () => Math.random() * 2
          }
        );
      });

      tl.fromTo(".ai-title", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
        .fromTo(".ai-spinner", { scale: 0, rotation: 0 }, { scale: 1, rotation: 360, duration: 1, ease: "back.out(1.5)" }, "-=0.3");

      Array.from(items).forEach((item, i) => {
        tl.to(item, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, `+=${i === 0 ? 0.2 : 0.3}`);
        const check = item.querySelector('.check-icon');
        if (check) tl.to(check, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, "-=0.2");
      });

      // Make the infinite animation separate from the main timeline so onComplete fires
      gsap.fromTo(".ai-almost", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, yoyo: true, repeat: -1, ease: "power1.inOut", delay: tl.duration() + 0.5 });
    }, containerRef);
    return () => ctx.revert();
  }, [onComplete]);

  const tasks = [
    'Initializing Neural Engine...',
    '✓ Deep scanning profile data',
    '✓ Analyzing skill gaps',
    '✓ Mapping career trajectory',
    'Synthesizing AI Growth Roadmap...',
    'Generating Premium Dashboard...',
    'Matching Top Tier Mentors...',
    'Discovering Elite Opportunities...',
    'Calculating Placement Readiness...',
    'Finalizing Superpowers...'
  ];

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-16 relative w-full overflow-hidden min-h-[400px]">
      {/* Particles Container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="ai-particle absolute w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(32,21,255,1)]" />
        ))}
      </div>

      <div className="ai-spinner w-24 h-24 rounded-full border-4 border-white/5 border-t-primary mb-8 animate-spin relative z-10 bg-white/[0.02] backdrop-blur-md shadow-[0_0_40px_rgba(32,21,255,0.4)] flex items-center justify-center">
        <span className="text-3xl animate-pulse">🤖</span>
      </div>
      
      <h2 className="ai-title text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-10 relative z-10 tracking-tight">Forging Your Future Workspace</h2>
      
      <div ref={listRef} className="space-y-4 text-left w-full max-w-sm relative z-10 bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {tasks.map((t, i) => {
          const isSubtask = t.startsWith('✓');
          return (
            <div key={i} className={`flex items-center gap-4 opacity-0 -translate-x-6 ${isSubtask ? 'pl-8' : ''}`} style={{ transform: 'translateX(-24px)' }}>
              {!isSubtask && (
                <div className="check-icon w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 scale-0 opacity-0 shadow-[0_0_15px_rgba(32,21,255,0.5)]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className={`${isSubtask ? 'text-gray-500 text-xs font-bold uppercase tracking-widest' : 'text-gray-200 font-bold text-sm tracking-wide'}`}>{t}</span>
            </div>
          );
        })}
      </div>
      <div className="ai-almost mt-10 relative z-10 px-6 py-2 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(32,21,255,0.3)] text-primary font-bold tracking-widest uppercase text-[10px]">Applying final polish</div>
    </div>
  );
};

// Screen 11: Success Screen
export const Step11Success = ({ data, onFinish }) => {
  const navigate = require('react-router-dom').useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.fromTo(".success-icon-container", { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.5)" })
        .fromTo(".success-title", { opacity: 0, y: 30, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: "power3.out" }, "-=0.5")
        .fromTo(".success-subtitle", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .fromTo(".success-card", { scale: 0.9, opacity: 0, y: 40 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "elastic.out(1, 0.7)" }, "-=0.4")
        .fromTo(".success-btn", { opacity: 0, scale: 0.8, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.5)" }, "-=0.4");
      
      // Count up animation for Profile Completion
      gsap.to({ val: 0 }, {
        val: 100,
        duration: 2.5,
        ease: 'power3.out',
        delay: 0.5,
        onUpdate: function() {
          const el = document.querySelector('.completion-stat');
          if (el) el.innerText = Math.round(this.targets()[0].val) + '%';
        }
      });
      
      // Infinite pulse on the icon
      gsap.to(".success-icon-container", { scale: 1.05, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 });
    });

    // Epic Confetti
    const duration = 4000;
    const end = Date.now() + duration;

    let rafId;
    (function frame() {
      confetti({ particleCount: 7, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#2015FF', '#ffffff', '#4ade80', '#c084fc'] });
      confetti({ particleCount: 7, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#2015FF', '#ffffff', '#4ade80', '#c084fc'] });
      if (Date.now() < end) rafId = requestAnimationFrame(frame);
    }());

    return () => {
      ctx.revert();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const firstSkill = data.skills?.[0]?.name || 'Algorithms';
  const todaysGoal = `Master ${firstSkill}`;

  const handleReviewProfile = () => {
    onFinish(); // complete onboarding first
    navigate('/profile');
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center w-full max-w-2xl mx-auto">
      <div className="success-icon-container w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(32,21,255,0.6)] border-4 border-white/10 relative">
        <span className="text-6xl drop-shadow-2xl">✨</span>
        <div className="absolute inset-0 bg-white/20 rounded-[2rem] animate-ping" style={{ animationDuration: '2s' }} />
      </div>
      
      <h1 className="success-title text-4xl sm:text-6xl font-black text-white mb-4 tracking-tight">You're In, {data.name?.split(' ')[0] || 'Engineer'}!</h1>
      <p className="success-subtitle text-xl text-gray-300 mb-10 font-medium">Your personalized workspace is primed and ready.</p>

      <div className="success-card w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-left mb-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col border-b border-white/5 pb-6">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">Destination</span>
            <span className="text-white font-bold text-lg">{data.dream_company || 'Top Tech'}</span>
          </div>
          <div className="flex flex-col border-b border-white/5 pb-6">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">Current Level</span>
            <span className="text-white font-bold text-lg">{data.experience_level || 'Apprentice'}</span>
          </div>
          <div className="flex flex-col border-b border-white/5 pb-6">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">Target Timeline</span>
            <span className="text-white font-bold text-lg">{data.placement_goal || 'Soon'}</span>
          </div>
          <div className="flex flex-col border-b border-white/5 pb-6">
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">Readiness Score</span>
            <span className="completion-stat text-primary font-black text-3xl drop-shadow-[0_0_10px_rgba(32,21,255,0.5)]">0%</span>
          </div>
        </div>
        
        <div className="flex flex-col pt-6">
          <span className="text-primary text-[10px] uppercase tracking-widest font-bold mb-5 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             Active Missions
          </span>
          <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4 group">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                <span className="text-primary font-bold text-xs group-hover:text-white">1</span>
              </div>
              <span className="text-gray-300 text-sm font-bold group-hover:text-white transition-colors">{todaysGoal}</span>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                <span className="text-primary font-bold text-xs group-hover:text-white">2</span>
              </div>
              <span className="text-gray-300 text-sm font-bold group-hover:text-white transition-colors">Review your new AI Roadmap</span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onFinish} className="success-btn bg-white hover:bg-gray-200 text-black font-black py-5 px-16 rounded-full transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 w-full sm:w-auto text-xl flex items-center justify-center gap-3">
        Enter Codovate
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
};
