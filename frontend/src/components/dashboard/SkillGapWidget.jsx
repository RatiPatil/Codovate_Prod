import { Link } from 'react-router-dom';

const SkillGapWidget = ({ skillGap }) => {
  if (!skillGap) return null;

  const { goal, strongSkills = [], gapSkills = [], analysis } = skillGap;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Skill Gap Analysis</h2>
            <span className="bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/30 tracking-widest">
              AI
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Personalized analysis for your goal: <span className="text-white font-semibold">{goal}</span>
          </p>
        </div>
        <Link
          to="/roadmap"
          className="hidden md:flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
        >
          Start Learning
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* AI Narrative */}
        {analysis && (
          <div className="relative z-10 flex gap-3 mb-8 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
            <span className="text-2xl shrink-0">🤖</span>
            <p className="text-sm text-gray-300 leading-relaxed">{analysis}</p>
          </div>
        )}

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Skills */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
              Strong Skills
            </h3>
            {strongSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {strongSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 italic">
                Add skills to your profile to see your strengths.
              </p>
            )}
          </div>

          {/* Skill Gaps */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
              Skills to Learn
            </h3>
            {gapSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {gapSkills.map((skill, i) => (
                  <Link
                    key={i}
                    to="/roadmap"
                    className="group px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                    {skill}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center gap-2 w-fit text-sm">
                <span>🎉</span> No critical gaps found!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillGapWidget;
