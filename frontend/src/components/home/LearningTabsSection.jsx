import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, CheckCircle, ArrowRight, Code2, Cpu, Layers, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const LearningTabsSection = () => {
  const sectionRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 'dsa',
      title: 'DSA & Algorithms',
      subtitle: 'Master Data Structures',
      icon: Code2,
      description:
        'Structured problem sets starting from Arrays, Strings, Trees, and Graphs to advanced Dynamic Programming patterns.',
      features: [
        '300+ Curated LeetCode/GFG style problems',
        'Time & Space complexity visualizer',
        'Step-by-step video & code hints',
      ],
      cta: 'Explore DSA Path',
    },
    {
      id: 'core',
      title: 'Core CS Subjects',
      subtitle: 'Computer Science Fundamentals',
      icon: Layers,
      description:
        'Comprehensive modules covering Operating Systems, DBMS, Computer Networks, and Object-Oriented Programming.',
      features: [
        'OS Process scheduling & memory management',
        'SQL query optimization & indexing',
        'System design fundamentals',
      ],
      cta: 'Explore Core Subjects',
    },
    {
      id: 'web',
      title: 'Full-Stack Web',
      subtitle: 'Build Modern Applications',
      icon: Terminal,
      description:
        'Learn React, Node.js, Express, MongoDB, PostgreSQL, and modern DevOps pipelines through real production codebases.',
      features: [
        'REST & GraphQL API design',
        'Authentication & state management',
        'CI/CD & cloud deployment',
      ],
      cta: 'Explore Web Path',
    },
    {
      id: 'ai',
      title: 'AI & Machine Learning',
      subtitle: 'Next-Gen Engineering',
      icon: Cpu,
      description:
        'Build AI applications using Python, LangChain, OpenAI APIs, vector databases, and Retrieval-Augmented Generation (RAG).',
      features: [
        'LLM API integration & prompt engineering',
        'Vector embeddings & Pinecone DB',
        'Building autonomous AI agents',
      ],
      cta: 'Explore AI Path',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.learning-tab-panel', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [activeTab]);

  return (
    <section ref={sectionRef} id="learning" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Structured Paths</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            A Simpler Way to Learn.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              Clear Curated Curriculum.
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            No endless playlists or outdated tutorials. Codovate organizes your learning into clear, goal-oriented tracks.
          </p>
        </div>

        {/* Tab Buttons Navigation */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 bg-slate-100/80 dark:bg-[#111522] p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 max-w-3xl mx-auto">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="learning-tab-panel max-w-4xl mx-auto p-7 sm:p-10 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {tabs[activeTab].subtitle}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {tabs[activeTab].title}
              </h3>
            </div>

            <Link
              to="/learning"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors self-start sm:self-auto"
            >
              <span>{tabs[activeTab].cta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {tabs[activeTab].description}
          </p>

          {/* Feature Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {tabs[activeTab].features.map((feat, fIdx) => (
              <div key={fIdx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-normal">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningTabsSection;
