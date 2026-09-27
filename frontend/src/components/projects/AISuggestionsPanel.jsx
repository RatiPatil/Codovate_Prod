const DIFFICULTY_COLORS = {
  Beginner: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Intermediate: 'text-amber-700 bg-amber-50 border-amber-200',
  Advanced: 'text-rose-700 bg-rose-50 border-rose-200',
};

const AISuggestionsPanel = ({ suggestions = [], onUse, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-slate-100 rounded-2xl p-6 h-36 border border-slate-200" />
        ))}
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-4">🤖</span>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Suggestions Yet</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Click "Get AI Suggestions" to generate personalized project ideas based on your skills and career goal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((s, i) => (
        <div key={i} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  {s.difficulty && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[s.difficulty] || DIFFICULTY_COLORS.Beginner}`}>
                      {s.difficulty}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onUse?.(s)}
                className="flex-shrink-0 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all whitespace-nowrap shadow-sm"
              >
                Use This
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {s.techStack?.map((t, ti) => (
                <span key={ti} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
                  {t}
                </span>
              ))}
              {s.estimatedTime && (
                <span className="text-[10px] text-slate-400 ml-auto font-medium">⏱ {s.estimatedTime}</span>
              )}
            </div>

            {s.whyRecommended && (
              <p className="mt-3 text-[11px] text-purple-700 font-medium flex items-start gap-1.5 bg-purple-50/50 p-2 rounded-xl border border-purple-100">
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
