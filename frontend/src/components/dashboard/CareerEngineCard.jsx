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
    <div className={`group relative bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col gap-4 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5`}>
      {/* Ambient glow */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent.glow}`} />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${accent.bg} border ${accent.border}`}>
            {icon}
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>{label}</p>
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">{title}</h3>
          </div>
        </div>
        {badge && (
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${accent.bg} ${accent.text} border ${accent.border} uppercase tracking-wide`}>
            {badge}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="relative z-10 text-xs text-gray-500 leading-relaxed line-clamp-2">{subtitle}</p>
      )}

      {/* Progress Bar */}
      {progress != null && (
        <div className="relative z-10">
          <div className="flex justify-between text-[10px] text-gray-600 mb-1">
            <span>Progress</span>
            <span className="font-bold text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${accent.text.replace('text-', 'bg-')}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="relative z-10 mt-auto">
        <Link
          to={link}
          className={`inline-flex items-center gap-1.5 text-xs font-bold ${accent.text} hover:opacity-80 transition-opacity`}
        >
          {linkText}
          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default CareerEngineCard;
