import React from 'react';
import { ChevronRight, Briefcase, Users, Star, Trophy, Eye, Download, Share2, Settings } from 'lucide-react';

/* ── Circular SVG progress ring ───────────────────────────────── */
const RingProgress = ({ pct = 0, size = 140 }) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={12} fill="none" stroke="#f3f4f6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={12} fill="none"
          stroke="url(#ringGrad)" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={dash}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-gray-900">{pct}%</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Completed</span>
      </div>
    </div>
  );
};

const RightSidebar = ({ 
  completionPct, 
  stats, 
  skills, 
  setEditingSection, 
  handleResumeDownload, 
  handleShareProfile 
}) => {
  return (
    <div className="space-y-6">
      
      {/* 1. Profile Completion */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center text-center">
        <h3 className="w-full text-left font-bold text-gray-900 mb-6">Profile Completion</h3>
        
        <div className="mb-6">
          <RingProgress pct={completionPct} />
        </div>
        
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          You're almost there! Complete remaining sections to increase your visibility.
        </p>
        
        <button 
          onClick={() => setEditingSection('missing')}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md"
        >
          Complete Your Profile
        </button>
      </div>

      {/* 2. Profile Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
        <h3 className="font-bold text-gray-900 p-4 pb-2">Profile Actions</h3>
        <div className="flex flex-col">
          <button className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
              <Eye size={18} className="text-gray-400 group-hover:text-indigo-500" /> View Public Profile
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          
          <button onClick={handleResumeDownload} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
              <Download size={18} className="text-gray-400 group-hover:text-indigo-500" /> Download Resume
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          
          <button onClick={handleShareProfile} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
              <Share2 size={18} className="text-gray-400 group-hover:text-indigo-500" /> Share Profile
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          
          <button className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
              <Settings size={18} className="text-gray-400 group-hover:text-indigo-500" /> Account Settings
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* 3. Profile Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Profile Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-center bg-gray-50/50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Briefcase size={16} />
            </div>
            <span className="text-xl font-black text-gray-900">{stats.applications || 0}</span>
            <span className="text-xs text-gray-500 font-medium mt-1">Applications</span>
          </div>
          
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-center bg-gray-50/50">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
              <Users size={16} />
            </div>
            <span className="text-xl font-black text-gray-900">{stats.interviews || 0}</span>
            <span className="text-xs text-gray-500 font-medium mt-1">Interviews</span>
          </div>
          
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-center bg-gray-50/50">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
              <Star size={16} />
            </div>
            <span className="text-xl font-black text-gray-900">{stats.shortlisted || 0}</span>
            <span className="text-xs text-gray-500 font-medium mt-1">Shortlisted</span>
          </div>
          
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-center bg-gray-50/50">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Trophy size={16} />
            </div>
            <span className="text-xl font-black text-gray-900">{stats.offers || 0}</span>
            <span className="text-xs text-gray-500 font-medium mt-1">Offers</span>
          </div>
        </div>
      </div>

      {/* 4. Top Skills */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Top Skills</h3>
          <button 
            onClick={() => setEditingSection('skills')}
            className="text-xs font-bold text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Edit Skills
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills && skills.length > 0 ? (
            skills.slice(0, 8).map((skill, idx) => {
              const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
              return (
                <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-lg border border-blue-100">
                  {skillName}
                </span>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 italic">No skills added yet.</p>
          )}
          {skills && skills.length > 8 && (
            <span className="px-3 py-1.5 bg-gray-50 text-gray-600 font-medium text-xs rounded-lg border border-gray-200">
              +{skills.length - 8} more
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default RightSidebar;
