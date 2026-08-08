import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Code2,
  Bot,
  FolderGit2,
  BookOpen,
  FileText,
  Video,
  Award,
  Sparkles,
  Users,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FeaturesGrid = () => {
  const sectionRef = useRef(null);

  const features = [
    {
      title: 'AI Career Roadmap Generator',
      desc: 'Creates a custom, step-by-step career path aligned with your dream role and current skill gaps.',
      icon: Bot,
      tag: 'AI Powered',
      progress: 92,
    },
    {
      title: 'Production Project Workspaces',
      desc: 'Build microservices, full-stack web apps, and AI tools with live team collaboration features.',
      icon: FolderGit2,
      tag: 'Hands-On',
      progress: 88,
    },
    {
      title: 'Auto-Evaluated Coding Sandbox',
      desc: 'Solve DSA and system design problems with instant test suite execution and time complexity checks.',
      icon: Code2,
      tag: 'Interactive',
      progress: 95,
    },
    {
      title: 'Smart Learning Modules',
      desc: 'Structured curriculum starting from foundational computer science to advanced AI engineering.',
      icon: BookOpen,
      tag: 'Structured',
      progress: 85,
    },
    {
      title: 'ATS Resume Review Engine',
      desc: 'Scans your resume against real tech job descriptions to optimize formatting, keywords, and impact.',
      icon: FileText,
      tag: 'Career Ready',
      progress: 90,
    },
    {
      title: 'Mock AI Technical Interviews',
      desc: 'Practice voice/text interview rounds with real-time feedback on your code and communication.',
      icon: Video,
      tag: 'Placement Prep',
      progress: 87,
    },
    {
      title: 'Skill Diagnostics & Badges',
      desc: 'Earn verifiable digital certificates and skill badges to showcase on your public portfolio.',
      icon: Award,
      tag: 'Credentials',
      progress: 94,
    },
    {
      title: 'Peer Learning & Contests',
      desc: 'Participate in weekly coding sprints, hackathons, and collaborative problem-solving circles.',
      icon: Users,
      tag: 'Community',
      progress: 91,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card-item', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      gsap.utils.toArray('.feature-progress-fill').forEach((bar) => {
        const targetWidth = bar.getAttribute('data-target');
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: `${targetWidth}%`,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 90%',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comprehensive Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Everything You Need to Grow.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400">
              All in One Place.
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            From your very first line of code to landing high-impact software roles, Codovate provides the complete toolkit.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="feature-card-item p-6 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {f.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {f.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>

                {/* Animated Skill Progress Fill */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    <span>Curriculum Coverage</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{f.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="feature-progress-fill h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      data-target={f.progress}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
