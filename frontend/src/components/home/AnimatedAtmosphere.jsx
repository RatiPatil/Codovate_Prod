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
  const haloRef = useRef(null);
  const outerRef = useRef(null);

  useEffect(() => {
    // 1. Focused 3-Layer Breathing Animations (Rich Core + Soft Halo + Subtle Atmosphere)
    // LAYER 1: Core (Focused, rich purple, subtle float)
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

    // LAYER 2: Halo (Soft atmospheric expand)
    const animHalo = gsap.to(haloRef.current, {
      scale: 1.1,
      opacity: 0.5,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // LAYER 3: Outer Atmosphere (Subtle outer pulse)
    const animOuter = gsap.to(outerRef.current, {
      scale: 1.05,
      opacity: 0.2,
      duration: 14,
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
      animHalo.kill();
      animOuter.kill();
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
        {/* LAYER 3: Outer Atmosphere (Subtle blend) */}
        <div
          ref={outerRef}
          className="absolute top-[140px] left-[50%] -translate-x-[50%] w-[680px] h-[380px] rounded-full blur-[110px] opacity-15 dark:opacity-25 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(192, 132, 252, 0.22) 0%, rgba(124, 58, 237, 0.10) 60%, transparent 80%)',
          }}
        />

        {/* LAYER 2: Halo (Soft atmospheric glow) */}
        <div
          ref={haloRef}
          className="absolute top-[160px] left-[50%] -translate-x-[50%] w-[520px] h-[300px] rounded-full blur-[75px] opacity-40 dark:opacity-50 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(99, 102, 241, 0.18) 55%, transparent 75%)',
          }}
        />

        {/* LAYER 1: Core (Focused, rich, defined purple center) */}
        <div
          ref={coreRef}
          className="absolute top-[180px] left-[50%] -translate-x-[50%] w-[360px] h-[220px] rounded-full blur-[45px] opacity-85 dark:opacity-90 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(147, 51, 234, 0.55) 0%, rgba(124, 58, 237, 0.32) 65%, transparent 85%)',
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedAtmosphere;
