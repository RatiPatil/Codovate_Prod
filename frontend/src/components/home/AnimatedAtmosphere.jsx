import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AnimatedAtmosphere = () => {
  const containerRef = useRef(null);
  const glowWrapperRef = useRef(null);
  const roundGlowRef = useRef(null);
  const roundCoreRef = useRef(null);
  const particlesRef = useRef(null);

  // Generate 32 subtle, elegant living particles
  const particles = useMemo(() => {
    const arr = [];
    const sizes = ['w-[1.5px] h-[1.5px]', 'w-1 h-1', 'w-[2.5px] h-[2.5px]', 'w-1.5 h-1.5'];
    const colors = [
      'bg-white/50 dark:bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.6)]',
      'bg-purple-200/60 dark:bg-purple-200/70 shadow-[0_0_8px_rgba(192,132,252,0.7)]',
      'bg-indigo-300/50 dark:bg-indigo-300/60 shadow-[0_0_6px_rgba(165,180,252,0.6)]',
    ];

    for (let i = 0; i < 32; i++) {
      const left = 5 + (i * 2.85) % 90;
      const top = 10 + ((i * 7.3) % 68);
      const size = sizes[i % sizes.length];
      const color = colors[i % colors.length];
      const duration = 6 + (i % 7) * 1.2;
      const delay = (i % 5) * 0.8;

      arr.push({ left: `${left}%`, top: `${top}%`, size, color, duration, delay });
    }
    return arr;
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // 1. Breathing & Gentle Motion on the Perfect Round Glow (9-13s)
        gsap.to(roundGlowRef.current, {
          scale: 1.05,
          opacity: 0.75,
          x: 10,
          y: -8,
          duration: 11,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // 2. Inner Round Core Pulse
        gsap.to(roundCoreRef.current, {
          scale: 1.08,
          opacity: 0.95,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // 3. Living Particles Shimmer & Float Loops
        if (particlesRef.current) {
          const dots = particlesRef.current.querySelectorAll('.atm-particle-dot');
          dots.forEach((dot, index) => {
            const p = particles[index];
            if (!p) return;
            gsap.to(dot, {
              y: -12,
              opacity: 0.45,
              duration: p.duration,
              delay: p.delay,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          });
        }
      }

      // 4. GSAP ScrollTrigger: Smooth 0% -> 100% Opacity Fade Out on Scroll
      gsap.fromTo(
        glowWrapperRef.current,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -70,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '380px top',
            scrub: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [particles]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1280px] h-[750px] z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        ref={glowWrapperRef}
        className="relative w-full h-full flex items-center justify-center will-change-[transform,opacity]"
      >
        {/* STRICTLY ROUND CIRCULAR RADIAL PURPLE HERO GLOW (No Ellipse, No Square) */}
        <div
          ref={roundGlowRef}
          className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] sm:w-[740px] sm:h-[740px] rounded-full aspect-square blur-[65px] sm:blur-[80px] opacity-60 dark:opacity-75 pointer-events-none transition-colors duration-500"
          style={{
            background:
              'radial-gradient(circle at center, rgba(147, 51, 234, 0.48) 0%, rgba(124, 58, 237, 0.28) 35%, rgba(99, 102, 241, 0.12) 58%, transparent 75%)',
          }}
        >
          {/* Defined Inner Soft Round Core */}
          <div
            ref={roundCoreRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[480px] sm:h-[480px] rounded-full aspect-square blur-[45px] sm:blur-[55px] opacity-85 dark:opacity-95 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(192, 132, 252, 0.70) 0%, rgba(139, 92, 246, 0.35) 48%, transparent 80%)',
            }}
          />
        </div>

        {/* LIVING ATMOSPHERIC PARTICLES (32 Organic Dots) */}
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none z-0">
          {particles.map((p, i) => (
            <div
              key={i}
              className={`atm-particle-dot absolute rounded-full opacity-20 pointer-events-none ${p.size} ${p.color}`}
              style={{ top: p.top, left: p.left }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedAtmosphere;
