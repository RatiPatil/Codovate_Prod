import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AnimatedAtmosphere = () => {
  const containerRef = useRef(null);
  const glowWrapperRef = useRef(null);
  const layerARef = useRef(null);
  const layerBRef = useRef(null);
  const layerCRef = useRef(null);

  useEffect(() => {
    // 1. Internal breathing & floating loops (scale & subtle movement)
    const glowA = gsap.to(layerARef.current, {
      scale: 1.08,
      opacity: 0.8,
      duration: 11,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const glowB = gsap.to(layerBRef.current, {
      scale: 0.94,
      opacity: 0.85,
      duration: 9,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    const glowC = gsap.to(layerCRef.current, {
      scale: 1.1,
      opacity: 0.75,
      duration: 13,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // 2. GSAP ScrollTrigger: Smooth opacity fade (1 -> 0 on scroll down, 0 -> 1 on scroll back up)
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
      glowA.kill();
      glowB.kill();
      glowC.kill();
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute top-0 left-0 right-0 h-[750px] z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div ref={glowWrapperRef} className="absolute inset-0 pointer-events-none">
        {/* Layer A: Large Purple Radial Glow */}
        <div
          ref={layerARef}
          className="absolute -top-[100px] left-[50%] -translate-x-[50%] w-[960px] h-[600px] rounded-full blur-[140px] opacity-75 dark:opacity-55 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(147, 51, 234, 0.28) 0%, rgba(124, 58, 237, 0.16) 45%, rgba(99, 102, 241, 0.08) 70%, transparent 85%)',
          }}
        />

        {/* Layer B: Soft Violet Glow */}
        <div
          ref={layerBRef}
          className="absolute top-[40px] left-[32%] w-[780px] h-[500px] rounded-full blur-[120px] opacity-70 dark:opacity-45 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(79, 70, 229, 0.12) 45%, transparent 70%)',
          }}
        />

        {/* Layer C: Lavender / White Central Highlight */}
        <div
          ref={layerCRef}
          className="absolute top-[80px] left-[50%] -translate-x-[50%] w-[480px] h-[320px] rounded-full blur-[90px] opacity-80 dark:opacity-40 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(192, 132, 252, 0.25) 0%, rgba(255, 255, 255, 0.15) 60%, transparent 80%)',
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedAtmosphere;
