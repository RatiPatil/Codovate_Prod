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
          <linearGradient id="iconStrokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#3B82F6" />
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

      {/* Floating Icon Node Cards matching exact CodeHelp DevTools specs */}
      {nodes.map((node) => {
        const IconComponent = node.icon;
        return (
          <div
            key={node.id}
            className={`orbital-node absolute hidden sm:flex pointer-events-auto cursor-default ${node.pos}`}
          >
            <div className="flex scale-90 sm:scale-100 items-center justify-center rounded-xl border px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-md border-slate-200/40 bg-white/55 shadow-[0_2px_12px_rgba(91,118,219,0.08)] dark:border-white/10 dark:bg-[rgba(30,30,30,0.80)] dark:shadow-[inset_0.8px_0.8px_10.88px_0_rgba(255,255,255,0.10)] dark:backdrop-blur-[29.77px] transition-all hover:scale-105">
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-purple-400 stroke-[1.2]" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrbitalSystem;
