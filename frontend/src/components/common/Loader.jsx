import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Loader = ({ fullScreen = false, message = "Loading...", size = "md" }) => {
  const containerRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const ring3Ref = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      const tl = gsap.timeline({ repeat: -1 });
      
      // Rotate rings at different speeds
      gsap.to(ring1Ref.current, { rotation: 360, duration: 1.5, ease: "linear", repeat: -1 });
      gsap.to(ring2Ref.current, { rotation: -360, duration: 2, ease: "linear", repeat: -1 });
      gsap.to(ring3Ref.current, { rotation: 360, duration: 2.5, ease: "linear", repeat: -1 });

      // Pulse text
      gsap.to(textRef.current, { opacity: 0.5, duration: 1, yoyo: true, repeat: -1, ease: "power1.inOut" });
    }
    
    return () => {
      gsap.killTweensOf([ring1Ref.current, ring2Ref.current, ring3Ref.current, textRef.current]);
    };
  }, []);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  const content = (
    <div ref={containerRef} className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${currentSizeClass}`}>
        {/* Outer Ring */}
        <div 
          ref={ring1Ref}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 opacity-80"
        />
        {/* Middle Ring */}
        <div 
          ref={ring2Ref}
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500 border-l-purple-500/50 opacity-80"
        />
        {/* Inner Ring */}
        <div 
          ref={ring3Ref}
          className="absolute inset-4 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500/50 opacity-80"
        />
        
        {/* Center Glow */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse pointer-events-none" />
      </div>
      
      {message && (
        <span ref={textRef} className="text-sm font-bold tracking-widest text-primary uppercase">
          {message}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center">
      {content}
    </div>
  );
};

export default Loader;
