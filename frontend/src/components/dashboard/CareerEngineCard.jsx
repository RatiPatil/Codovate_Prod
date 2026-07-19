import { Link } from 'react-router-dom';

const accentMap = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   glow: 'bg-blue-500/20'   },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'bg-purple-500/20' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  glow: 'bg-green-500/20'  },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', glow: 'bg-yellow-500/20' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'bg-orange-500/20' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    glow: 'bg-red-500/20'    },
  pink:   { bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   text: 'text-pink-400',   glow: 'bg-pink-500/20'   },
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400',   glow: 'bg-cyan-500/20'   },
};

/**
 * CareerEngineCard – A reusable card for each AI Career Engine section on the Dashboard.
 * Props:
 *  icon        – Emoji icon
 *  label       – Section label (e.g., "Career Roadmap")
 *  title       – Main headline text
 *  subtitle    – Secondary description text
 *  progress    – Optional 0–100 progress number
 *  link        – Navigation destination
 *  linkText    – CTA button text
 *  accentColor – One of: blue | purple | green | yellow | orange | red | pink | cyan
 *  badge       – Optional small badge text
 */
const CareerEngineCard = ({
  icon = '⚡',
  label = 'Section',
  title = 'Title',
  subtitle = '',
  progress = null,
  link = '/',
  linkText = 'Open',
  accentColor = 'blue',
  badge = null,
}) => {
  const accent = accentMap[accentColor] || accentMap.blue;

  return (
    <div className={`group relative glass-panel border border-white/5 rounded-3xl p-7 overflow-hidden flex flex-col gap-5 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] hover:-translate-y-1`}>
      {/* Ambient glow */}
      <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[70px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${accent.glow}`} />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-2xl shrink-0 ${accent.bg} border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
            <span className="drop-shadow-md">{icon}</span>
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${accent.text} mb-1 opacity-90`}>{label}</p>
            <h3 className="text-base font-extrabold text-white leading-tight line-clamp-1">{title}</h3>
          </div>
        </div>
        {badge && (
          <span className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-xl ${accent.bg} ${accent.text} border ${accent.border} uppercase tracking-widest shadow-sm`}>
            {badge}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="relative z-10 text-sm text-gray-400 font-medium leading-relaxed line-clamp-2 mt-1">{subtitle}</p>
      )}

      {/* Progress Bar */}
      {progress != null && (
        <div className="relative z-10 mt-auto pt-2">
          <div className="flex justify-between text-[11px] text-gray-500 font-bold mb-2 uppercase tracking-wide">
            <span>Progress</span>
            <span className="text-gray-300">{progress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden shadow-inner border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${accent.text.replace('text-', 'bg-')}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="relative z-10 mt-auto pt-4 border-t border-white/5 flex justify-end">
        <Link
          to={link}
          className={`inline-flex items-center gap-2 text-sm font-black ${accent.text} bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 transition-all group-hover:translate-x-1`}
        >
          {linkText}
          <svg className="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default CareerEngineCard;
