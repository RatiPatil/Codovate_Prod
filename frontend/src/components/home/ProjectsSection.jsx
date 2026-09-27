import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FolderGit2, ArrowUpRight, Code, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ProjectsSection = () => {
  const sectionRef = useRef(null);

  const projects = [
    {
      title: 'AI RAG Document Assistant',
      desc: 'Build an autonomous document search agent using LangChain, OpenAI embeddings, and Pinecone vector store.',
      tags: ['React', 'Node.js', 'Python', 'Vector DB'],
      level: 'Advanced',
      impact: 'AI Engineering',
    },
    {
      title: 'Real-Time Collaborative Canvas',
      desc: 'Create a Figma-style multi-user whiteboard with WebSockets, CRDT conflict resolution, and canvas state sync.',
      tags: ['TypeScript', 'WebSockets', 'Canvas API'],
      level: 'Intermediate',
      impact: 'System Architecture',
    },
    {
      title: 'Cross-Platform Career Tracker',
      desc: 'Develop a full-stack placement portal with role matching, ATS resume scoring, and OAuth2 authentication.',
      tags: ['Next.js', 'PostgreSQL', 'Tailwind'],
      level: 'Intermediate',
      impact: 'Full-Stack Web',
    },
    {
      title: 'Market Sentiment AI Predictor',
      desc: 'Implement a financial data pipeline parsing news feeds with Transformer sentiment analysis models.',
      tags: ['Python', 'FastAPI', 'PyTorch', 'Docker'],
      level: 'Advanced',
      impact: 'Machine Learning',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.project-card-item', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
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
    <section ref={sectionRef} id="projects" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Production Workspaces</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Build Real Software.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                Not Toy Apps.
              </span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base">
              Construct portfolio-worthy projects engineered with production databases, security, and deployment pipelines.
            </p>
          </div>

          <Link
            to="/projecthub"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 self-start md:self-auto"
          >
            <span>Explore All Projects</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Production Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p, i) => (
            <div
              key={i}
              className="project-card-item p-7 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800">
                    {p.impact}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> {p.level}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {p.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
                  <span>Start Workspace</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
