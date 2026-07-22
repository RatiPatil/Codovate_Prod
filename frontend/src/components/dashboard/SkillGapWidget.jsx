import { Link } from 'react-router-dom';

const SkillGapWidget = ({ skillGap }) => {
  if (!skillGap) return null;

  const { goal, strongSkills = [], gapSkills = [], analysis } = skillGap;

  return (
    <div className="w-full relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Skill Gap Analysis</h2>
            <span className="bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/30 tracking-widest animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.4)]">
              AI Powered
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            Personalized analysis for your goal: <span className="text-white font-bold bg-white/5 px-2 py-1 rounded border border-white/10">{goal}</span>
          </p>
        </div>
        <Link
          to="/roadmap"
          className="hidden md:flex items-center gap-2 text-sm font-black text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-xl border border-purple-500/20"
        >
          Start Learning
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="glass-panel border border-white/5 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-xl">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700" />

        {/* AI Narrative */}
        {analysis && (
          <div className="relative z-10 flex gap-4 mb-10 p-5 bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl shadow-inner">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/30">
               <span className="text-2xl animate-pulse drop-shadow-md">🤖</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium self-center">{analysis}</p>
          </div>
        )}

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strong Skills */}
          <div className="glass-panel bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5 hover:border-green-500/30 transition-colors duration-300">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] inline-block animate-pulse"></span>
              Strong Skills
            </h3>
            {strongSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {strongSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl shadow-sm hover:-translate-y-0.5 transition-transform cursor-default"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-medium italic p-4 bg-white/5 rounded-xl border border-white/5">
                Add skills to your profile to see your strengths.
              </p>
            )}
          </div>

          {/* Skill Gaps */}
          <div className="glass-panel bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5 hover:border-red-500/30 transition-colors duration-300">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] inline-block animate-pulse"></span>
              Skills to Learn
            </h3>
            {gapSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {gapSkills.map((skill, i) => (
                  <Link
                    key={i}
                    to="/roadmap"
                    className="group/skill px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 hover:border-red-500/60 transition-all flex items-center gap-2 shadow-sm hover:-translate-y-0.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover/skill:scale-150 transition-transform shrink-0 shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
                    {skill}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center gap-3 w-fit text-sm shadow-inner">
                <span className="text-xl">🎉</span> No critical gaps found!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillGapWidget;
