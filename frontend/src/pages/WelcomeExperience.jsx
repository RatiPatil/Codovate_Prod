import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';

const WelcomeExperience = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fire confetti
    if (!prefersReducedMotion) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#2015ff', '#4035ff', '#a78bfa', '#ffffff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#2015ff', '#4035ff', '#a78bfa', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }

    // GSAP animation
    const tl = gsap.timeline();
    if (!prefersReducedMotion) {
      tl.fromTo(textRef.current.children, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out' }
      );
    } else {
      gsap.set(textRef.current.children, { opacity: 1, y: 0 });
    }

    // Auto navigate
    const timer = setTimeout(() => {
      if (!prefersReducedMotion) {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => navigate('/dashboard', { replace: true })
        });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }, 4500);

    return () => {
      clearTimeout(timer);
      gsap.killTweensOf(containerRef.current);
    };
  }, [navigate]);

  return (
    <div ref={containerRef} className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div ref={textRef} className="relative z-10 text-center px-4">
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-white font-bold text-5xl shadow-[0_0_50px_rgba(32,21,255,0.6)] mx-auto mb-10 transform transition-transform hover:scale-110">
          C
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
          Welcome to <span className="text-gradient">Codovate</span> 🎉
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 font-medium mb-3">
          Your AI Career Workspace is ready.
        </p>
        <p className="text-lg text-gray-500">
          Let's personalize your experience...
        </p>
      </div>
    </div>
  );
};

export default WelcomeExperience;
