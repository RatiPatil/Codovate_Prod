import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Compass,
  CheckCircle2,
  FolderGit2,
  Code2,
  FileText,
  Video,
  Briefcase,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FeaturesGrid = () => {
  const sectionRef = useRef(null);

  const features = [
    {
      icon: Compass,
      title: 'AI Career Roadmap',
      badge: 'Personalized',
      desc: 'Dynamically adapts your daily tasks based on target role, current skill gaps, and market hiring trends.',
      progressLabel: 'Roadmap Completion Rate',
      progressVal: '92%',
      color: 'from-blue-500 to-indigo-600',
      link: '/roadmap',
    },
    {
      icon: CheckCircle2,
      title: 'Skill Assessment Engine',
      badge: 'Automated',
      desc: 'Take timed diagnostic tests with real-time test cases, code quality analysis, and peer benchmarks.',
      progressLabel: 'Avg Score Improvement',
      progressVal: '88%',
      color: 'from-indigo-500 to-purple-600',
      link: '/skill-assessments',
    },
    {
      icon: FolderGit2,
      title: 'Production Project Hub',
      badge: 'Collaboration',
      desc: 'Build full-stack microservices, frontend applications, and AI integrations with team workspace tools.',
      progressLabel: 'Project Verification Index',
      progressVal: '95%',
      color: 'from-purple-500 to-rose-500',
      link: '/projecthub',
    },
    {
      icon: Code2,
      title: 'Interactive Coding Practice',
      badge: 'IDE Included',
      desc: 'Solve curated DSA, System Design, and Full-Stack challenges directly inside the browser editor.',
      progressLabel: 'Submission Acceptance Rate',
      progressVal: '85%',
      color: 'from-emerald-500 to-teal-600',
      link: '/coding-practice',
    },
    {
      icon: FileText,
      title: 'Resume & Portfolio Builder',
      badge: 'Placement Ready',
      desc: 'Create job-optimized resumes and generate a public live developer portfolio with one click.',
      progressLabel: 'ATS Compliance Score',
      progressVal: '96%',
      color: 'from-amber-500 to-orange-600',
      link: '/resume-builder',
    },
    {
      icon: Video,
      title: 'AI Mock Interviews',
      badge: 'Voice & Code',
      desc: 'Practice technical & HR interviews with instant AI feedback on code clarity, speed, and communication.',
      progressLabel: 'Interview Preparedness',
      progressVal: '90%',
      color: 'from-sky-500 to-indigo-600',
      link: '/mock-interview',
    },
    {
      icon: Briefcase,
      title: 'Career Opportunities',
      badge: 'Direct Match',
      desc: 'Get matched with tech companies, startups, and campus placement drives based on assessment ranks.',
      progressLabel: 'Placement Match Rate',
      progressVal: '94%',
      color: 'from-violet-500 to-purple-700',
      link: '/opportunities',
    },
    {
      icon: Award,
      title: 'Verified Certificates',
      badge: 'Shareable',
      desc: 'Earn tamper-proof blockchain-verified skill credentials upon completing roadmap milestones.',
      progressLabel: 'Verification Success',
      progressVal: '100%',
      color: 'from-indigo-600 to-blue-700',
      link: '/profile',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards entrance
      gsap.from('.feature-card', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });

      // Progress bar fill animation
      gsap.utils.toArray('.feature-progress-bar').forEach((bar) => {
        const targetWidth = bar.getAttribute('data-target');
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: targetWidth,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 85%',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comprehensive Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need to Grow.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              In One Place.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Purpose-built components designed to take you from classroom coding to top-tier software engineering placements.
          </p>
        </div>

        {/* Feature Cards Grid: 8 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="feature-card p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                      {f.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="pt-5 space-y-2.5 border-t border-slate-100 mt-5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium text-[11px]">{f.progressLabel}</span>
                    <span className="font-mono font-bold text-indigo-600 text-xs">{f.progressVal}</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <div
                      className="feature-progress-bar h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full"
                      data-target={f.progressVal}
                    />
                  </div>

                  <Link
                    to={f.link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors pt-1"
                  >
                    <span>Explore Module</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
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
