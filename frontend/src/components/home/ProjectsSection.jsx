import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FolderGit2, Bot, Layout, Smartphone, BarChart3, ExternalLink, ArrowRight, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ProjectsSection = () => {
  const sectionRef = useRef(null);

  const projectCards = [
    {
      title: 'AI RAG Document Assistant',
      category: 'AI / Machine Learning',
      badge: 'Production RAG',
      desc: 'Retrieval-augmented Generation pipeline with vector embeddings, semantic search, and streaming responses.',
      icon: Bot,
      tags: ['TypeScript', 'Python', 'Pinecone', 'LangChain'],
      color: 'from-purple-500 to-indigo-600',
    },
    {
      title: 'Real-time Collaborative Canvas',
      category: 'Full-Stack Web App',
      badge: 'WebSockets',
      desc: 'Multi-user shared whiteboard with live cursor tracking, CRDT state synchronization, and room management.',
      icon: Layout,
      tags: ['React 19', 'Node.js', 'Socket.io', 'Tailwind'],
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Cross-Platform Career Tracker',
      category: 'Mobile Application',
      badge: 'React Native',
      desc: 'Mobile application to log coding practice streaks, daily interview prep reminders, and offer status updates.',
      icon: Smartphone,
      tags: ['React Native', 'Firebase', 'Redux Toolkit'],
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Market Sentiment AI Predictor',
      category: 'Data Science & ML',
      badge: 'Financial ML',
      desc: 'Automated NLP pipeline parsing financial news sentiment to predict short-term equity price movements.',
      icon: BarChart3,
      tags: ['Python', 'PyTorch', 'FastAPI', 'Pandas'],
      color: 'from-amber-500 to-orange-600',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.project-card-item', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="projects" ref={sectionRef} className="py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Hands-On Experience</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Learn by Building.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600">
              Ship Production Code.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Stop building generic tutorial clones. Codovate guides you through architecting real software that recruiters actually care about.
          </p>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projectCards.map((p, i) => {
            const IconComp = p.icon;
            return (
              <div
                key={i}
                className="project-card-item p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                      {p.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {p.category}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                      <span>{p.title}</span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{p.desc}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <Link
                    to="/projecthub"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors"
                  >
                    <span>View Project Spec</span>
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

export default ProjectsSection;
