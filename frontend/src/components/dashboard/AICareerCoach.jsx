import { Link } from 'react-router-dom';

const AICareerCoach = ({ profile }) => {
  const target = profile?.career_goal || 'Backend Developer';
  const missingSkills = profile?.skills?.length ? ['Docker', 'AWS'] : ['SQL Joins', 'REST APIs', 'Spring Boot'];
  
  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl animate-bounce">🤖</span>
        <h2 className="text-lg font-bold text-white">AI Career Coach</h2>
      </div>
      
      <p className="text-gray-300 text-sm mb-4">
        Before applying to <span className="text-white font-bold">{target}</span> roles, I highly recommend you complete:
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {missingSkills.map((skill, i) => (
          <span key={i} className="bg-black/50 border border-white/10 text-xs font-semibold px-3 py-1.5 rounded-lg text-white">
            {skill}
          </span>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <p className="text-xs text-primary font-bold uppercase mb-1">Recommended Project</p>
        <p className="text-white font-semibold text-sm">Library Management System</p>
      </div>

      <div className="flex gap-3">
        <Link to="/opportunities" className="flex-1 bg-white hover:bg-gray-200 text-black font-bold py-2.5 rounded-xl text-center text-sm transition-colors">
          View Roadmap
        </Link>
        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-sm transition-colors border border-white/10">
          Ask AI
        </button>
      </div>
    </div>
  );
};

export default AICareerCoach;
