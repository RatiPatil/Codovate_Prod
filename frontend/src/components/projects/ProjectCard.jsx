import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  planned: 'bg-slate-50 text-slate-600 border-slate-200',
};

const STATUS_LABEL = {
  completed: 'Completed',
  in_progress: 'In Progress',
  planned: 'Planned',
};

const ProjectCard = ({ project, onEdit, onDelete, isOwner = false }) => {
  const {
    id, title, description, techStack = [], githubUrl, liveUrl,
    thumbnailUrl, status = 'in_progress', teamMembers = [], milestones = [], featured,
  } = project;

  const completedMilestones = milestones.filter((m) => m.done).length;
  const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : null;

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      {/* Thumbnail / gradient fallback */}
      <div className="relative h-40 bg-gradient-to-br from-blue-500/20 via-indigo-600/10 to-transparent overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <img loading="lazy" decoding="async" src={thumbnailUrl} alt={title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-20">💻</span>
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] || STATUS_COLORS.planned}`}>
          {STATUS_LABEL[status] || status}
        </span>
        {featured && (
          <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            ⭐ Featured
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        {/* Title & description */}
        <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{title}</h3>
        {description && (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">{description}</p>
        )}

        {/* Tech Stack */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {techStack.slice(0, 5).map((tech, i) => (
              <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                {tech}
              </span>
            ))}
            {techStack.length > 5 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-400">
                +{techStack.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Milestone progress */}
        {milestoneProgress !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Milestones</span>
              <span className="font-bold text-slate-700">{completedMilestones}/{milestones.length}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${milestoneProgress}%` }} />
            </div>
          </div>
        )}

        {/* Team members */}
        {teamMembers.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {teamMembers.slice(0, 4).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600" title={m.name || m}>
                {(m.name || m || '?').charAt(0).toUpperCase()}
              </div>
            ))}
            {teamMembers.length > 4 && (
              <span className="text-[10px] text-slate-400 font-bold">+{teamMembers.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="mt-auto flex items-center gap-2">
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          )}
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Live Demo
            </a>
          )}
          {isOwner && (
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => onEdit?.(project)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all text-xs" title="Edit">✏️</button>
              <button onClick={() => onDelete?.(id)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all text-xs" title="Delete">🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
