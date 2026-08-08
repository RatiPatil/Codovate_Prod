import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AnimatedAtmosphere = () => {
  const containerRef = useRef(null);
  const layerARef = useRef(null);
  const layerBRef = useRef(null);
  const layerCRef = useRef(null);
  const layerDRef = useRef(null);

  useEffect(() => {
    // LAYER 1: Continuous independent breathing & floating loops (8-15s)
    const glowA = gsap.to(layerARef.current, {
      scale: 1.08,
      x: 20,
      y: 18,
      opacity: 0.82,
      duration: 11,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const glowB = gsap.to(layerBRef.current, {
      scale: 0.94,
      x: -25,
      y: -20,
      opacity: 0.88,
      duration: 9,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    const glowC = gsap.to(layerCRef.current, {
      scale: 1.1,
      x: 15,
      y: -12,
      opacity: 0.78,
      duration: 13,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const glowD = gsap.to(layerDRef.current, {
      scale: 1.14,
      x: -18,
      y: 15,
      opacity: 0.65,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // LAYER 2: ScrollTrigger position shifts
    const scrollCtx = gsap.context(() => {
      gsap.to(containerRef.current, {
        y: '65vh',
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        },
      });
    });

    return () => {
      glowA.kill();
      glowB.kill();
      glowC.kill();
      glowD.kill();
      scrollCtx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden min-h-screen transition-colors duration-300"
      aria-hidden="true"
    >
      {/* Base Canvas (#FCFDFF for light / #080A12 for dark) */}
      <div className="absolute inset-0 bg-[#FCFDFF] dark:bg-[#080A12] transition-colors duration-300" />

      {/* Layer A: Large Purple Radial Glow */}
      <div
        ref={layerARef}
        className="absolute top-[8vh] left-[50%] -translate-x-[50%] w-[960px] h-[680px] rounded-full blur-[140px] opacity-75 dark:opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 51, 234, 0.16) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(255, 255, 255, 0) 75%)',
        }}
      />

      {/* Layer B: Soft Violet Glow */}
      <div
        ref={layerBRef}
        className="absolute top-[16vh] left-[32%] w-[780px] h-[560px] rounded-full blur-[120px] opacity-70 dark:opacity-45"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(79, 70, 229, 0.12) 45%, rgba(255, 255, 255, 0) 70%)',
        }}
      />

      {/* Layer C: Lavender / White Central Highlight */}
      <div
        ref={layerCRef}
        className="absolute top-[20vh] left-[48%] -translate-x-[50%] w-[480px] h-[360px] rounded-full blur-[90px] opacity-80 dark:opacity-35"
        style={{
          background:
            'radial-gradient(circle, rgba(192, 132, 252, 0.22) 0%, rgba(255, 255, 255, 0.9) 60%, rgba(255, 255, 255, 0) 80%)',
        }}
      />

      {/* Layer D: Subtle Peripheral Glow */}
      <div
        ref={layerDRef}
        className="absolute top-[28vh] right-[25%] w-[600px] h-[440px] rounded-full blur-[110px] opacity-50 dark:opacity-35"
        style={{
          background:
            'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(129, 140, 248, 0.07) 50%, rgba(255, 255, 255, 0) 75%)',
        }}
      />
    </div>
  );
};

export default AnimatedAtmosphere;
