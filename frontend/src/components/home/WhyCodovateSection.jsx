import { ArrowRight, CheckCircle2, Cpu, Link2 } from 'lucide-react';

const connections = [
  {
    title: 'Profile to Career',
    flow: ['Profile', 'Opportunities', 'Applications'],
    desc: 'Your profile powers smart opportunity matching and single-click application tracking.',
  },
  {
    title: 'Profile to Teammates',
    flow: ['Profile', 'Teams'],
    desc: 'Skill-based matching discovers complementary peers to build projects together.',
  },
  {
    title: 'Learning to Skills',
    flow: ['Learning', 'Verified Skills'],
    desc: 'Completing course modules automatically proves your practical capabilities.',
  },
  {
    title: 'All in One Resume',
    flow: ['Profile + Skills + Projects', 'ATS Resume'],
    desc: 'Your complete college journey converts directly into a job-ready resume.',
  },
];

const WhyCodovateSection = () => {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold uppercase tracking-wider">
            <Link2 size={14} />
            INTEGRATED ECOSYSTEM
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
            One Platform. One Connected Journey.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Unlike isolated tools, every module in Codovate works together to build your student career profile.
          </p>
        </div>

        {/* 4 Connected Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>

              {/* Flow Pills */}
              <div className="flex items-center gap-2 flex-wrap py-2">
                {item.flow.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200/60">
                      {step}
                    </span>
                    {idx < item.flow.length - 1 && (
                      <ArrowRight size={14} className="text-blue-500" />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyCodovateSection;
