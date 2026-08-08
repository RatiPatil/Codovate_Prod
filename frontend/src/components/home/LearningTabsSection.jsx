import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code2, BookOpen, FolderGit2, Bot, Video, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const LearningTabsSection = () => {
  const [activeTab, setActiveTab] = useState('dsa');
  const contentRef = useRef(null);
  const sectionRef = useRef(null);

  const tabs = [
    { id: 'dsa', label: 'DSA Masterclass', icon: Code2 },
    { id: 'core', label: 'Core CS Subjects', icon: BookOpen },
    { id: 'projects', label: 'Full-Stack Projects', icon: FolderGit2 },
    { id: 'ai', label: 'AI Engineering', icon: Bot },
    { id: 'interview', label: 'Interview Mastery', icon: Video },
  ];

  const tabData = {
    dsa: {
      title: 'Master Data Structures & Algorithms from Zero',
      desc: 'Structured curriculum covering Arrays, Graphs, Dynamic Programming, and Tries with visual step-by-step trace animations.',
      highlights: [
        '300+ LeetCode-style curated problem solutions',
        'Time & Space complexity breakdown cards',
        'Pattern-based learning (Two Pointers, Sliding Window, Graph DFS/BFS)',
      ],
      ctaText: 'Start DSA Path',
      link: '/learning',
      bgGradient: 'from-blue-600/10 to-indigo-600/10',
    },
    core: {
      title: 'Deep-Dive Computer Science Core Fundamentals',
      desc: 'Essential CS theory tailored for top tech company screening interviews and technical round accuracy.',
      highlights: [
        'Operating Systems & Concurrency Locks',
        'Database Internals & Indexing Optimization',
        'Computer Networks (TCP/IP, HTTP/3, Websockets)',
      ],
      ctaText: 'Explore Core CS',
      link: '/learning',
      bgGradient: 'from-purple-600/10 to-indigo-600/10',
    },
    projects: {
      title: 'Build Production Apps with Real Microservices',
      desc: 'Move beyond simple CRUD apps. Build real-time chat, collaborative whiteboards, and scalable payment platforms.',
      highlights: [
        'End-to-end TypeScript & React 19 architecture',
        'PostgreSQL, Redis, and WebSockets setup',
        'Automated CI/CD deployments to cloud providers',
      ],
      ctaText: 'Explore Project Hub',
      link: '/projecthub',
      bgGradient: 'from-indigo-600/10 to-purple-600/10',
    },
    ai: {
      title: 'Integrate LLMs, RAG, & Vector Databases',
      desc: 'Learn how to build AI-first applications using OpenAI, Anthropic APIs, LangChain, and Pinecone vector stores.',
      highlights: [
        'Prompt engineering & context window management',
        'Retrieval-Augmented Generation (RAG) pipelines',
        'Fine-tuning open-source models (Llama 3, Mistral)',
      ],
      ctaText: 'Start AI Track',
      link: '/student/ai-dashboard',
      bgGradient: 'from-emerald-600/10 to-teal-600/10',
    },
    interview: {
      title: 'Crack Technical & HR Interviews with Confidence',
      desc: 'Simulate high-pressure technical interviews with voice-enabled AI mentors and get instant evaluation reports.',
      highlights: [
        'System design mock rounds (Scalability, Caching)',
        'Behavioral STAR technique answer generator',
        'Live coding under timed mock environment',
      ],
      ctaText: 'Try AI Interview',
      link: '/mock-interview',
      bgGradient: 'from-rose-600/10 to-amber-600/10',
    },
  };

  const currentData = tabData[activeTab];

  // Animate tab content transition
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  return (
    <section id="learning" ref={sectionRef} className="py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Structured Path</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            A Simpler Way to Learn.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
              Guaranteed Results.
            </span>
          </h2>
          <p className="text-slate-600 text-base">
            Switch tabs to see how Codovate systematically builds your technical depth across key domains.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/60 max-w-4xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-md border border-indigo-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Panel */}
        <div
          ref={contentRef}
          className={`p-8 sm:p-12 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl transition-all duration-300 bg-gradient-to-br ${currentData.bgGradient}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                {currentData.title}
              </h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                {currentData.desc}
              </p>

              <div className="space-y-3 pt-2">
                {currentData.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to={currentData.link}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
                >
                  <span>{currentData.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 hidden lg:flex justify-center">
              <div className="w-full aspect-square rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white flex flex-col justify-between shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-200">
                    Codovate Guarantee
                  </span>
                  <h4 className="text-xl font-bold">100% Mastery Framework</h4>
                  <p className="text-xs text-indigo-100/80">
                    Interactive assessments verify every single concept before unlocking the next module.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningTabsSection;
