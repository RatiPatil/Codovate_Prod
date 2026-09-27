import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AtmosphericGlow = () => {
  const glowContainerRef = useRef(null);
  const layer1Ref = useRef(null);
  const layer2Ref = useRef(null);
  const layer3Ref = useRef(null);

  useEffect(() => {
    // Continuous breathing micro-animations
    const breathe1 = gsap.to(layer1Ref.current, {
      x: '+=80',
      y: '+=40',
      scale: 1.15,
      opacity: 0.85,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const breathe2 = gsap.to(layer2Ref.current, {
      x: '-=90',
      y: '-=50',
      scale: 1.2,
      opacity: 0.9,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const breathe3 = gsap.to(layer3Ref.current, {
      x: '+=50',
      y: '-=30',
      scale: 1.25,
      opacity: 0.95,
      duration: 9,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Scroll-linked position movement tracking the overall page scroll
    const scrollTriggerCtx = gsap.context(() => {
      // Hero to Footer continuous glow travel path
      gsap.to(glowContainerRef.current, {
        y: '70vh',
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
      breathe1.kill();
      breathe2.kill();
      breathe3.kill();
      scrollTriggerCtx.revert();
    };
  }, []);

  return (
    <div
      ref={glowContainerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden min-h-screen transition-opacity duration-1000"
      aria-hidden="true"
    >
      {/* Background canvas backdrop */}
      <div className="absolute inset-0 bg-[#FCFDFF]" />

      {/* Layer 1: Large violet radial glow */}
      <div
        ref={layer1Ref}
        className="absolute top-[10vh] left-[50%] -translate-x-[50%] w-[900px] h-[650px] rounded-full blur-[140px] opacity-70"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(255, 255, 255, 0) 75%)',
        }}
      />

      {/* Layer 2: Soft blue-violet glow */}
      <div
        ref={layer2Ref}
        className="absolute top-[18vh] left-[35%] w-[750px] h-[550px] rounded-full blur-[120px] opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, rgba(147, 51, 234, 0.1) 45%, rgba(255, 255, 255, 0) 70%)',
        }}
      />

      {/* Layer 3: Small bright lavender center highlight */}
      <div
        ref={layer3Ref}
        className="absolute top-[22vh] left-[48%] -translate-x-[50%] w-[450px] h-[350px] rounded-full blur-[90px] opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(192, 132, 252, 0.22) 0%, rgba(129, 140, 248, 0.12) 60%, rgba(255, 255, 255, 0) 80%)',
        }}
      />

      {/* Layer 4: Extremely subtle soft white center highlight */}
      <div
        className="absolute top-[25vh] left-[50%] -translate-x-[50%] w-[280px] h-[200px] rounded-full blur-[60px] opacity-90"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 80%)',
        }}
      />
    </div>
  );
};

export default AtmosphericGlow;
