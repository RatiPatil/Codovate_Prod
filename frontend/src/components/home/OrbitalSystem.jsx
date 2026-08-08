import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Code2,
  Bot,
  BookOpen,
  FolderGit2,
  FileText,
  Video,
  GraduationCap,
  Monitor,
} from 'lucide-react';

const OrbitalSystem = () => {
  const containerRef = useRef(null);

  const nodes = [
    { id: 'code', label: 'Code Engine', icon: Code2, pos: 'top-[12%] left-[8%] md:left-[12%]' },
    { id: 'ai', label: 'AI Roadmap', icon: Bot, pos: 'top-[8%] right-[10%] md:right-[15%]' },
    { id: 'projects', label: 'Projects Hub', icon: FolderGit2, pos: 'top-[38%] left-[3%] md:left-[6%]' },
    { id: 'learning', label: 'Smart Modules', icon: BookOpen, pos: 'top-[40%] right-[4%] md:right-[8%]' },
    { id: 'resume', label: 'ATS Resume', icon: FileText, pos: 'top-[68%] left-[10%] md:left-[14%]' },
    { id: 'interview', label: 'Mock AI Interview', icon: Video, pos: 'top-[70%] right-[11%] md:right-[16%]' },
    { id: 'cap', label: 'Placement Prep', icon: GraduationCap, pos: 'top-[54%] right-[18%]' },
    { id: 'monitor', label: 'IDE Sandbox', icon: Monitor, pos: 'top-[58%] left-[16%]' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.orbital-node').forEach((node, i) => {
        gsap.to(node, {
          y: i % 2 === 0 ? '-=15' : '+=15',
          rotate: i % 2 === 0 ? '+=3' : '-=3',
          duration: 4 + (i % 3),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.3,
        });
      });

      gsap.to('.orbital-ring-1', {
        rotation: 360,
        duration: 120,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });

      gsap.to('.orbital-ring-2', {
        rotation: -360,
        duration: 160,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-0 h-[850px] pointer-events-none z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Curved SVG Orbital Paths (Hero Only) */}
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[850px] opacity-60 dark:opacity-40"
        viewBox="0 0 1400 850"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="orbitGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="orbitGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Primary Orbital Ellipse (Hero) */}
        <ellipse
          className="orbital-ring-1"
          cx="700"
          cy="420"
          rx="580"
          ry="320"
          stroke="url(#orbitGradient1)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />

        {/* Secondary Inner Orbital Ring */}
        <ellipse
          className="orbital-ring-2"
          cx="700"
          cy="420"
          rx="420"
          ry="230"
          stroke="url(#orbitGradient2)"
          strokeWidth="1.2"
          strokeDasharray="6 4"
        />
      </svg>

      {/* Floating Icon Node Cards */}
      {nodes.map((node) => {
        const IconComponent = node.icon;
        return (
          <div
            key={node.id}
            className={`orbital-node absolute hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-[#151926]/90 backdrop-blur-md border border-purple-100/80 dark:border-slate-800 shadow-[0_8px_24px_rgba(99,102,241,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors pointer-events-auto cursor-default ${node.pos}`}
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/80 dark:to-purple-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/50 shadow-xs">
              <IconComponent className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
              {node.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OrbitalSystem;
