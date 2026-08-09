import { useEffect, useRef, useMemo } from 'react';
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
  const layerDRef = useRef(null);
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
      const top = 12 + ((i * 7.3) % 65);
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
        // 1. Layer A: Primary Breathing Loop (Slow & Infinite, 11s)
        gsap.to(layerARef.current, {
          scale: 1.04,
          opacity: 0.95,
          duration: 11,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // 2. Layer B: Secondary Organic Drift (X/Y Movement, 16s)
        gsap.to(layerBRef.current, {
          x: 20,
          y: -15,
          scale: 1.03,
          duration: 16,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // 3. Layer C: Soft Core Pulse (8.5s)
        gsap.to(layerCRef.current, {
          scale: 1.06,
          opacity: 0.92,
          duration: 8.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // 4. Layer D: Highlight Shimmer (6.5s)
        gsap.to(layerDRef.current, {
          scale: 1.08,
          opacity: 0.95,
          duration: 6.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // 5. Living Particles Shimmer & Float Loops
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

      // 6. GSAP ScrollTrigger: Smooth 0% -> 100% Opacity Fade Out & Upward Drift on Scroll
      gsap.fromTo(
        glowWrapperRef.current,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -90,
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
        {/* LAYER A: Large Deep Diffuse Atmosphere (50-70% Viewport Width) */}
        <div
          ref={layerARef}
          className="absolute top-[16%] left-1/2 -translate-x-1/2 w-[850px] sm:w-[1100px] h-[520px] sm:h-[650px] rounded-full blur-[150px] opacity-75 dark:opacity-85 pointer-events-none transition-colors duration-500"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.38) 0%, rgba(99, 102, 241, 0.22) 38%, rgba(147, 51, 234, 0.10) 65%, transparent 85%)',
          }}
        />

        {/* LAYER B: Medium Violet Atmosphere (Secondary Organic Drift) */}
        <div
          ref={layerBRef}
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[650px] sm:w-[820px] h-[380px] sm:h-[480px] rounded-full blur-[110px] opacity-70 dark:opacity-85 pointer-events-none transition-colors duration-500"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.48) 0%, rgba(109, 93, 251, 0.26) 45%, transparent 75%)',
          }}
        />

        {/* LAYER C: Soft Lavender Core */}
        <div
          ref={layerCRef}
          className="absolute top-[24%] left-1/2 -translate-x-1/2 w-[450px] sm:w-[580px] h-[280px] sm:h-[360px] rounded-full blur-[75px] opacity-85 dark:opacity-95 pointer-events-none transition-colors duration-500"
          style={{
            background:
              'radial-gradient(circle at center, rgba(168, 85, 247, 0.60) 0%, rgba(124, 58, 237, 0.32) 55%, transparent 85%)',
          }}
        />

        {/* LAYER D: Central Blue-Violet Highlight Core */}
        <div
          ref={layerDRef}
          className="absolute top-[26%] left-1/2 -translate-x-1/2 w-[300px] sm:w-[380px] h-[180px] sm:h-[240px] rounded-full blur-[45px] opacity-90 dark:opacity-100 pointer-events-none transition-colors duration-500"
          style={{
            background:
              'radial-gradient(circle at center, rgba(192, 132, 252, 0.75) 0%, rgba(99, 102, 241, 0.38) 60%, transparent 90%)',
          }}
        />

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
