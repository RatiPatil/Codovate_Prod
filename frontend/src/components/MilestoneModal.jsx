import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';

const MilestoneModal = ({ isOpen, onClose, title = "Milestone Unlocked!", description = "You've reached a new level." }) => {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Check reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        // Fire confetti
        const duration = 2500;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#2015ff', '#a78bfa', '#fbbf24']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#2015ff', '#a78bfa', '#fbbf24']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();

        // Animate entrance
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modalRef.current, 
          { scale: 0.8, opacity: 0, y: 50 }, 
          { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)', delay: 0.1 }
        );
        
        // 3D Badge flip and float
        gsap.fromTo(badgeRef.current, 
          { rotateY: -180, scale: 0 }, 
          { rotateY: 0, scale: 1, duration: 1, ease: 'elastic.out(1, 0.5)', delay: 0.3 }
        );
        gsap.to(badgeRef.current, {
          y: -10,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          delay: 1.3
        });
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, { scale: 0.8, opacity: 0, y: 50, duration: 0.3, ease: 'power2.in' });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, onComplete: onClose, delay: 0.1 });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        ref={modalRef} 
        className="glass-panel p-8 md:p-10 rounded-3xl max-w-sm w-full relative overflow-hidden flex flex-col items-center text-center shadow-2xl"
      >
        {/* Glow behind badge */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/20 rounded-full blur-[40px] pointer-events-none" />
        
        <div 
          ref={badgeRef}
          className="w-32 h-32 mb-6 relative z-10 flex items-center justify-center transform-style-3d"
        >
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400/30 shadow-[0_0_30px_rgba(250,204,21,0.4)]" />
          {/* Inner Medal */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-inner flex items-center justify-center border border-yellow-200">
            <span className="text-5xl font-black text-yellow-900 drop-shadow-md">100%</span>
          </div>
          {/* Sparkles */}
          <span className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</span>
          <span className="absolute bottom-2 -left-3 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>✨</span>
        </div>

        <h3 className="text-2xl font-black text-white mb-2 relative z-10">
          {title}
        </h3>
        <p className="text-gray-400 text-sm font-medium mb-8 relative z-10">
          {description}
        </p>

        <button 
          onClick={handleClose}
          className="btn-primary w-full py-3 text-sm font-bold shadow-[0_0_20px_rgba(32,21,255,0.3)] relative z-10"
        >
          Awesome! Let's Go 🚀
        </button>
      </div>
    </div>
  );
};

export default MilestoneModal;
