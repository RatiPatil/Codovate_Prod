import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Sparkles,
  Code2,
  FolderGit2,
  BookOpen,
  FileText,
  Video,
  Compass,
  Users,
  Cpu,
} from 'lucide-react';
import Logo from '../common/Logo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ConnectedOrbitSection = () => {
  const sectionRef = useRef(null);

  const orbitNodes = [
    { label: 'Code Engine', icon: Code2, angle: 0, distance: 220, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Project Hub', icon: FolderGit2, angle: 51, distance: 220, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'Smart Learning', icon: BookOpen, angle: 102, distance: 220, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'ATS Resume', icon: FileText, angle: 153, distance: 220, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'AI Interview', icon: Video, angle: 204, distance: 220, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { label: 'Career Engine', icon: Compass, angle: 255, distance: 220, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Peer Network', icon: Users, angle: 306, distance: 220, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro reveal animation
      gsap.from('.orbit-center-node', {
        scale: 0.8,
        opacity: 0,
        duration: 0.9,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });

      gsap.from('.orbit-outer-node', {
        scale: 0,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      });

      // Orbit container subtle continuous rotation
      gsap.to('.orbit-spin-wrapper', {
        rotation: 360,
        duration: 180,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });

      // Counter rotate nodes so text stays upright
      gsap.to('.orbit-node-inner', {
        rotation: -360,
        duration: 180,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="orbit-core" ref={sectionRef} className="py-24 md:py-32 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Connected Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            One Unified Platform.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
              Infinite Possibilities.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Every module inside Codovate feeds data into your central AI Career Engine, automatically tuning your learning path and project portfolio.
          </p>
        </div>

        {/* Orbit System Layout */}
        <div className="relative w-full max-w-[650px] h-[550px] md:h-[620px] mx-auto flex items-center justify-center">
          {/* Orbital Rings Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 650 650">
            <circle
              cx="325"
              cy="325"
              r="220"
              fill="none"
              stroke="rgba(99, 102, 241, 0.2)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
            <circle
              cx="325"
              cy="325"
              r="140"
              fill="none"
              stroke="rgba(168, 85, 247, 0.15)"
              strokeWidth="1"
            />

            {/* Connecting rays to nodes */}
            {orbitNodes.map((n, idx) => {
              const rad = (n.angle * Math.PI) / 180;
              const x2 = 325 + Math.cos(rad) * n.distance;
              const y2 = 325 + Math.sin(rad) * n.distance;
              return (
                <line
                  key={idx}
                  x1="325"
                  y1="325"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(129, 140, 248, 0.3)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {/* Central Codovate Node */}
          <div className="orbit-center-node z-20 p-6 rounded-3xl bg-white shadow-[0_12px_40px_rgba(79,70,229,0.2)] border-2 border-indigo-200/90 flex flex-col items-center gap-2 max-w-[190px]">
            <Logo size="md" />
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>AI Core Hub</span>
            </div>
          </div>

          {/* Rotating Outer Nodes Container */}
          <div className="orbit-spin-wrapper absolute inset-0 w-full h-full pointer-events-none">
            {orbitNodes.map((node, i) => {
              const rad = (node.angle * Math.PI) / 180;
              const left = 325 + Math.cos(rad) * node.distance - 65;
              const top = 325 + Math.sin(rad) * node.distance - 30;
              const IconComp = node.icon;

              return (
                <div
                  key={i}
                  className="orbit-outer-node absolute pointer-events-auto"
                  style={{ left: `${left}px`, top: `${top}px` }}
                >
                  <div className="orbit-node-inner px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border shadow-md flex items-center gap-2 transition-transform hover:scale-110 cursor-pointer">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${node.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight whitespace-nowrap">
                      {node.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConnectedOrbitSection;
