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

  useEffect(() => {
    // LAYER 1: Continuous independent breathing & floating loops (8-14s)
    const glow1 = gsap.to(layerARef.current, {
      scale: 1.08,
      x: 25,
      y: 20,
      opacity: 0.85,
      duration: 11,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const glow2 = gsap.to(layerBRef.current, {
      scale: 0.92,
      x: -30,
      y: -25,
      opacity: 0.9,
      duration: 13,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    const glow3 = gsap.to(layerCRef.current, {
      scale: 1.12,
      x: 20,
      y: -15,
      opacity: 0.75,
      duration: 9,
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
      glow1.kill();
      glow2.kill();
      glow3.kill();
      scrollCtx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden min-h-screen"
      aria-hidden="true"
    >
      {/* Pure / Near-White Base Canvas */}
      <div className="absolute inset-0 bg-[#FCFDFF]" />

      {/* Atmosphere Layer A: Large Purple Radial Glow */}
      <div
        ref={layerARef}
        className="absolute top-[8vh] left-[50%] -translate-x-[50%] w-[950px] h-[680px] rounded-full blur-[140px] opacity-75"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 51, 234, 0.14) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(255, 255, 255, 0) 75%)',
        }}
      />

      {/* Atmosphere Layer B: Smaller Violet Glow */}
      <div
        ref={layerBRef}
        className="absolute top-[16vh] left-[32%] w-[780px] h-[560px] rounded-full blur-[120px] opacity-70"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, rgba(79, 70, 229, 0.1) 45%, rgba(255, 255, 255, 0) 70%)',
        }}
      />

      {/* Atmosphere Layer C: Subtle White / Lavender Center Highlight */}
      <div
        ref={layerCRef}
        className="absolute top-[20vh] left-[48%] -translate-x-[50%] w-[480px] h-[360px] rounded-full blur-[90px] opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(192, 132, 252, 0.2) 0%, rgba(255, 255, 255, 0.9) 60%, rgba(255, 255, 255, 0) 80%)',
        }}
      />
    </div>
  );
};

export default AnimatedAtmosphere;
