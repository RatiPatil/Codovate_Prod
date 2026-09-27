import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

const OnboardingSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const ringRef = useRef(null);
  const checkmarkRef = useRef(null);

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tl = gsap.timeline();

    if (!prefersReducedMotion) {
      // Set initial states
      gsap.set(contentRef.current.children, { y: 20, opacity: 0 });
      gsap.set(ringRef.current, { scale: 0, opacity: 0 });
      gsap.set(checkmarkRef.current, { scale: 0, opacity: 0 });

      // Confetti burst
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#eab308']
      });

      // Animate checkmark
      tl.to(ringRef.current, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' })
        .to(checkmarkRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.2')
        .to(ringRef.current, { scale: 1.1, duration: 0.8, yoyo: true, repeat: -1, ease: 'power1.inOut' }, '+=0.2');

      // Animate text
      tl.to(contentRef.current.children, { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, '-=0.4');
    }

    const timer = setTimeout(() => {
      if (!prefersReducedMotion) {
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 1.05,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => navigate('/dashboard', { replace: true })
        });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      gsap.killTweensOf('*');
    };
  }, [navigate]);

  return (
    <div ref={containerRef} className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Checkmark */}
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          <div 
            ref={ringRef} 
            className="absolute inset-0 rounded-full border-4 border-green-500/30 bg-green-500/10"
          />
          <div 
            ref={checkmarkRef}
            className="w-16 h-16 rounded-full bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.5)] flex items-center justify-center text-black"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <div ref={contentRef} className="text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            You're all set, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">{user?.name?.split(' ')[0] || 'Builder'}</span>!
          </h1>
          <p className="text-lg md:text-xl text-gray-400 font-medium mb-2">
            Your Codovate profile has been crafted perfectly.
          </p>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2 mt-6">
            <span className="w-4 h-4 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
            Taking you to your dashboard...
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccess;
