import { Link } from 'react-router-dom';
import { Users, MessageSquare, Target, CheckCircle2, ArrowRight } from 'lucide-react';

const demoStudents = [
  {
    name: 'Aarav Sharma',
    college: 'COEP Technological University',
    role: 'Frontend Dev',
    skills: ['React', 'TypeScript', 'Tailwind'],
    match: '95%',
    matchColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarBg: 'bg-gradient-to-tr from-blue-500 to-indigo-600',
  },
  {
    name: 'Ananya Verma',
    college: 'IIT Bombay',
    role: 'Backend Architect',
    skills: ['Node.js', 'Python', 'PostgreSQL'],
    match: '92%',
    matchColor: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarBg: 'bg-gradient-to-tr from-indigo-500 to-purple-600',
  },
  {
    name: 'Rohan Mehta',
    college: 'BITS Pilani',
    role: 'UI/UX Designer',
    skills: ['Figma', 'Prototyping', 'User Research'],
    match: '88%',
    matchColor: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarBg: 'bg-gradient-to-tr from-purple-500 to-pink-600',
  },
];

const TeamsSpotlight = () => {
  return (
    <section className="py-20 md:py-28 bg-slate-50/60 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Product UI Mockup (Student Discovery & Match Cards) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-slate-600 ml-2">Student Match Discovery</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  Product Preview
                </span>
              </div>

              {/* Student Cards List */}
              <div className="space-y-3">
                {demoStudents.map((st, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-full ${st.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                        {st.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{st.name}</h4>
                          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">• {st.role}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{st.college}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {st.skills.map(sk => (
                            <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${st.matchColor}`}>
                        {st.match} Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right Column: Feature Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Users size={14} />
              COLLABORATE
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight">
              Great Projects Start With the Right Team.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Discover students based on skills and goals, connect with the right people, create teams, and collaborate in real time.
            </p>

            {/* 3 Feature Highlights */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Target size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Skill-Based Discovery</h4>
                  <p className="text-sm text-slate-600 mt-0.5">Find students whose skills complement yours for hackathons and projects.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Team Workspaces</h4>
                  <p className="text-sm text-slate-600 mt-0.5">Create focused spaces for your team projects, join codes, and member management.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Real-Time Chat</h4>
                  <p className="text-sm text-slate-600 mt-0.5">Collaborate with your team instantly without leaving Codovate.</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Link
                to="/teams"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group"
              >
                Find Your Team
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default TeamsSpotlight;
