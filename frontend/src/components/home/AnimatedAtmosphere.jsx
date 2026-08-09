import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AnimatedAtmosphere = () => {
  const containerRef = useRef(null);
  const glowWrapperRef = useRef(null);
  const coreRef = useRef(null);

  useEffect(() => {
    // 1. Atmosphere breathing loop matching HTML reference spec
    const animCore = gsap.to(coreRef.current, {
      scale: 1.06,
      opacity: 0.95,
      x: 6,
      y: -4,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // 2. GSAP ScrollTrigger: Smooth opacity fade (1 -> 0 on scroll down 0-300px, 0 -> 1 on scroll back to top)
    const ctx = gsap.context(() => {
      gsap.fromTo(
        glowWrapperRef.current,
        { opacity: 1 },
        {
          opacity: 0,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '300px top',
            scrub: true,
          },
        }
      );
    }, containerRef);

    return () => {
      animCore.kill();
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute top-0 left-0 right-0 h-[650px] z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div ref={glowWrapperRef} className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Reference Atmospheric Purple Light Glow Element */}
        <div
          ref={coreRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[220px] -z-10 w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600/25 via-indigo-600/28 to-purple-600/30 dark:from-blue-500/30 dark:via-purple-600/35 dark:to-indigo-500/30 blur-3xl"
          style={{ animation: '1.2s ease 0s 1 normal forwards running nf-glow-fade' }}
        />
      </div>
    </div>
  );
};

export default AnimatedAtmosphere;
