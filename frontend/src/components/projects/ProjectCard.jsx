import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  planned: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const STATUS_LABEL = {
  completed: 'Completed',
  in_progress: 'In Progress',
  planned: 'Planned',
};

const LANG_COLORS = {
  Java: 'bg-orange-500', JavaScript: 'bg-yellow-500', Python: 'bg-blue-400',
  TypeScript: 'bg-blue-600', 'C++': 'bg-pink-500', Go: 'bg-cyan-500',
  Rust: 'bg-orange-700', Ruby: 'bg-red-500', default: 'bg-gray-500',
};

const ProjectCard = ({ project, onEdit, onDelete, isOwner = false }) => {
  const {
    id, title, description, techStack = [], githubUrl, liveUrl,
    thumbnailUrl, status = 'in_progress', teamMembers = [], milestones = [], featured,
  } = project;

  const completedMilestones = milestones.filter((m) => m.done).length;
  const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : null;

  return (
    <div className="group relative bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Thumbnail / gradient fallback */}
      <div className="relative h-40 bg-gradient-to-br from-primary/30 via-purple-600/20 to-transparent overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
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
          <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            ⭐ Featured
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        {/* Title & description */}
        <h3 className="text-base font-bold text-white mb-1 line-clamp-1">{title}</h3>
        {description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4">{description}</p>
        )}

        {/* Tech Stack */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {techStack.slice(0, 5).map((tech, i) => (
              <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                {tech}
              </span>
            ))}
            {techStack.length > 5 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-500">
                +{techStack.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Milestone progress */}
        {milestoneProgress !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-600 mb-1">
              <span>Milestones</span>
              <span className="font-bold text-gray-400">{completedMilestones}/{milestones.length}</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: `${milestoneProgress}%` }} />
            </div>
          </div>
        )}

        {/* Team members */}
        {teamMembers.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {teamMembers.slice(0, 4).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary" title={m.name || m}>
                {(m.name || m || '?').charAt(0).toUpperCase()}
              </div>
            ))}
            {teamMembers.length > 4 && (
              <span className="text-[10px] text-gray-500 font-bold">+{teamMembers.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="mt-auto flex items-center gap-2">
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          )}
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-light px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Live Demo
            </a>
          )}
          {isOwner && (
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => onEdit?.(project)} className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all text-xs" title="Edit">✏️</button>
              <button onClick={() => onDelete?.(id)} className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs" title="Delete">🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
