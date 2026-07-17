const DIFFICULTY_COLORS = {
  Beginner: 'text-green-400 bg-green-500/10 border-green-500/30',
  Intermediate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Advanced: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const AISuggestionsPanel = ({ suggestions = [], onUse, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-white/5 rounded-2xl p-6 h-36 border border-white/5" />
        ))}
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-4">🤖</span>
        <h3 className="text-lg font-bold text-white mb-2">No Suggestions Yet</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Click "Get AI Suggestions" to generate personalized project ideas based on your skills and career goal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((s, i) => (
        <div key={i} className="group bg-[#0d0d10] border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/15 transition-colors duration-500" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white">{s.title}</h3>
                  {s.difficulty && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[s.difficulty] || DIFFICULTY_COLORS.Beginner}`}>
                      {s.difficulty}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{s.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onUse?.(s)}
                className="flex-shrink-0 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-xl border border-primary/30 transition-all whitespace-nowrap"
              >
                Use This
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {s.techStack?.map((t, ti) => (
                <span key={ti} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-400">
                  {t}
                </span>
              ))}
              {s.estimatedTime && (
                <span className="text-[10px] text-gray-600 ml-auto">⏱ {s.estimatedTime}</span>
              )}
            </div>

            {s.whyRecommended && (
              <p className="mt-3 text-[11px] text-purple-400 flex items-start gap-1.5">
                <span className="shrink-0">🎯</span>
                {s.whyRecommended}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AISuggestionsPanel;
