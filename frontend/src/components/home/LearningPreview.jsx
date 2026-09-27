import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock, ArrowRight, Layers, Award } from 'lucide-react';

const courses = [
  {
    title: 'Full-Stack Web Development',
    category: 'Web Dev',
    modules: '8 Modules',
    level: 'Beginner to Advanced',
    desc: 'Master React, Node.js, Express, and database integrations.',
    color: 'border-l-blue-500',
    bg: 'bg-blue-50/50',
    badge: 'Popular',
  },
  {
    title: 'Data Structures & Algorithms',
    category: 'Computer Science',
    modules: '10 Modules',
    level: 'Intermediate',
    desc: 'Solve real interview questions in C++, Java, and Python.',
    color: 'border-l-indigo-500',
    bg: 'bg-indigo-50/50',
    badge: 'Essential',
  },
  {
    title: 'Cloud Architecture & DevOps',
    category: 'Cloud',
    modules: '6 Modules',
    level: 'Intermediate',
    desc: 'Deploy production applications with Docker, Kubernetes, and AWS.',
    color: 'border-l-purple-500',
    bg: 'bg-purple-50/50',
    badge: 'Trending',
  },
];

const LearningPreview = () => {
  return (
    <section className="py-20 md:py-28 bg-slate-50/70 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold uppercase tracking-wider">
              <BookOpen size={14} />
              LEARNING HUB
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Keep Learning. Keep Moving.
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Build practical skills with structured learning tracks designed for college students.
            </p>
          </div>

          <Link
            to="/learning"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/70 border border-purple-200/60 transition-all shrink-0 group"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3 Course Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((c, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs border-l-4 ${c.color} hover:shadow-lg transition-all duration-300 flex flex-col justify-between group`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {c.category}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    {c.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-xl group-hover:text-purple-600 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {c.desc}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Layers size={14} className="text-purple-500" />
                    {c.modules}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={14} className="text-blue-500" />
                    {c.level}
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to="/learning"
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-center text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Start Learning</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default LearningPreview;
