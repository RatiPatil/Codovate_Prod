import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BookOpen,
  Globe,
  Brain,
  FileCode2,
  Terminal,
  FileCheck2,
  Video,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FreeResourcesSection = () => {
  const sectionRef = useRef(null);

  const resources = [
    {
      title: 'Core Computer Science',
      desc: 'OS, DBMS, Computer Networks, and System Architecture visual guides.',
      icon: BookOpen,
      count: '48 Modules',
      badge: 'Free',
      link: '/learning',
    },
    {
      title: 'Full-Stack Web Dev',
      desc: 'React 19, Next.js, Node.js, Express, and PostgreSQL masterclass.',
      icon: Globe,
      count: '65 Lessons',
      badge: 'Popular',
      link: '/learning',
    },
    {
      title: 'AI & Machine Learning',
      desc: 'Python fundamentals, PyTorch models, and LLM API integrations.',
      icon: Brain,
      count: '32 Projects',
      badge: 'Trending',
      link: '/learning',
    },
    {
      title: 'Tech Articles & Docs',
      desc: 'Deep dives into engineering architecture, design patterns, and case studies.',
      icon: FileCode2,
      count: '120+ Articles',
      badge: 'Updated',
      link: '/learning',
    },
    {
      title: 'Online Web Compiler',
      desc: 'Multi-language instant code runner with C++, Java, Python, and TypeScript.',
      icon: Terminal,
      count: 'Instant Tool',
      badge: 'Interactive',
      link: '/coding-practice',
    },
    {
      title: 'Placement Mock Tests',
      desc: 'Real company diagnostic tests matching Amazon, Google, and Microsoft formats.',
      icon: FileCheck2,
      count: '25 Tests',
      badge: 'Verified',
      link: '/skill-assessments',
    },
    {
      title: 'Video Tutorials',
      desc: 'Step-by-step problem explanations and system design walkthroughs.',
      icon: Video,
      count: '200+ Videos',
      badge: 'HD',
      link: '/learning',
    },
    {
      title: 'Developer Challenges',
      desc: 'Weekly algorithmic hackathons with global leaderboard prizes.',
      icon: Trophy,
      count: 'Weekly Event',
      badge: 'Live',
      link: '/coding-practice',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.resource-card', {
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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="resources" ref={sectionRef} className="py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Access Library</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Free Developer Resources.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Zero Paywalls.
            </span>
          </h2>
          <p className="text-slate-600 text-base">
            Everything you need to strengthen core concepts and practice engineering skills.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((r, i) => {
            const Icon = r.icon;
            return (
              <Link
                key={i}
                to={r.link}
                className="resource-card group p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {r.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                      <span>{r.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{r.desc}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>{r.count}</span>
                  <span className="text-indigo-600 font-bold group-hover:underline">Explore</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FreeResourcesSection;
