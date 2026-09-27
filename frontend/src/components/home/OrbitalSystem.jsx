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
    // Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Soft floating animation for icons with gentle opacity breathing
      gsap.utils.toArray('.orbital-node').forEach((node, i) => {
        gsap.to(node, {
          y: i % 2 === 0 ? -8 : 8,
          opacity: i % 2 === 0 ? 0.75 : 0.55,
          duration: 5 + (i % 4),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.4,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-0 h-[850px] pointer-events-none z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 
        INVISIBLE SVG Path for positioning reference only.
        Zero visible strokes, zero dashed lines, zero visible orbital borders.
      */}
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[850px] opacity-0 pointer-events-none"
        viewBox="0 0 1400 850"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="700" cy="420" rx="580" ry="320" stroke="none" />
        <ellipse cx="700" cy="420" rx="420" ry="230" stroke="none" />
      </svg>

      {/* Floating Translucent Icon Badges (No strong borders, soft atmospheric blend) */}
      {nodes.map((node) => {
        const IconComponent = node.icon;
        return (
          <div
            key={node.id}
            className={`orbital-node absolute hidden sm:flex pointer-events-auto cursor-default opacity-65 ${node.pos}`}
          >
            <div className="flex scale-90 sm:scale-100 items-center justify-center rounded-full w-10 h-10 sm:w-12 sm:h-12 aspect-square backdrop-blur-md bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-xs hover:bg-white/45 dark:hover:bg-white/10 transition-all duration-300">
              <IconComponent className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-indigo-600 dark:text-purple-300 opacity-90 stroke-[1.5]" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrbitalSystem;
