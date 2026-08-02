import { Link } from 'react-router-dom';
import { Briefcase, Users, BookOpen, FileText, ArrowRight } from 'lucide-react';

const cards = [
  {
    num: '01',
    icon: Briefcase,
    title: 'Discover Opportunities',
    desc: 'Find internships, jobs, and opportunities aligned with your skills and goals.',
    badge: null,
    cta: 'Explore Opportunities',
    path: '/opportunities',
    color: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    num: '02',
    icon: Users,
    title: 'Find Your Team',
    desc: 'Connect with students, discover complementary skills, and build together.',
    badge: 'Real-time collaboration',
    cta: 'Discover Teams',
    path: '/teams',
    color: 'from-indigo-500 to-purple-600',
    iconBg: 'bg-indigo-50 text-indigo-600',
  },
  {
    num: '03',
    icon: BookOpen,
    title: 'Learn & Grow',
    desc: 'Build practical skills with structured learning and track your progress.',
    badge: null,
    cta: 'Start Learning',
    path: '/learning',
    color: 'from-purple-500 to-pink-600',
    iconBg: 'bg-purple-50 text-purple-600',
  },
  {
    num: '04',
    icon: FileText,
    title: 'Build Your Resume',
    desc: 'Turn your profile, projects, skills, and experience into a professional resume.',
    badge: null,
    cta: 'Build Resume',
    path: '/resume-builder',
    color: 'from-blue-600 to-purple-600',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
];

const PlatformFeatures = () => {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100">
            CORE PLATFORM
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
            Everything You Need to Move Forward
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            One connected platform for your college-to-career journey.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((item) => (
            <div
              key={item.num}
              className="group bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300/80 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <div className="space-y-5">
                {/* Header Row: Num + Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-300 tracking-widest">{item.num}</span>
                  <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon size={22} />
                  </div>
                </div>

                {/* Badge if present */}
                {item.badge && (
                  <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {item.badge}
                  </span>
                )}

                {/* Title & Desc */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Bottom CTA Link */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to={item.path}
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group/link"
                >
                  <span>{item.cta}</span>
                  <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PlatformFeatures;
