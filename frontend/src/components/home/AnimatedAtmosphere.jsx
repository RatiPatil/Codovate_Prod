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
    // Layer A: Large purple radial glow (11 seconds)
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

    // Layer B: Soft violet glow (9 seconds)
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

    // Layer C: Lavender/white central highlight (13 seconds)
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

    // Layer D: Very subtle peripheral glow (15 seconds)
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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden min-h-screen"
      aria-hidden="true"
    >
      {/* Pure / Near-White Base Canvas (#FCFDFF) */}
      <div className="absolute inset-0 bg-[#FCFDFF]" />

      {/* Layer A: Large Purple Radial Glow ( concentrated behind hero center ) */}
      <div
        ref={layerARef}
        className="absolute top-[8vh] left-[50%] -translate-x-[50%] w-[960px] h-[680px] rounded-full blur-[140px] opacity-75"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 51, 234, 0.14) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(255, 255, 255, 0) 75%)',
        }}
      />

      {/* Layer B: Soft Violet Glow */}
      <div
        ref={layerBRef}
        className="absolute top-[16vh] left-[32%] w-[780px] h-[560px] rounded-full blur-[120px] opacity-70"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, rgba(79, 70, 229, 0.1) 45%, rgba(255, 255, 255, 0) 70%)',
        }}
      />

      {/* Layer C: Lavender / White Central Highlight */}
      <div
        ref={layerCRef}
        className="absolute top-[20vh] left-[48%] -translate-x-[50%] w-[480px] h-[360px] rounded-full blur-[90px] opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(192, 132, 252, 0.2) 0%, rgba(255, 255, 255, 0.9) 60%, rgba(255, 255, 255, 0) 80%)',
        }}
      />

      {/* Layer D: Very Subtle Peripheral Glow */}
      <div
        ref={layerDRef}
        className="absolute top-[28vh] right-[25%] w-[600px] h-[440px] rounded-full blur-[110px] opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(129, 140, 248, 0.05) 50%, rgba(255, 255, 255, 0) 75%)',
        }}
      />
    </div>
  );
};

export default AnimatedAtmosphere;
