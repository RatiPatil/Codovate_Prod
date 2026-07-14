import { useState } from 'react';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';

const StudentProfileModal = ({ student, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      await api.post('/networking/connect', { receiver_id: student.id });
      showAlert('Connection request sent!', 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 lg:p-10 overflow-y-auto">
      <div className="absolute inset-0 min-h-[120%]" onClick={onClose} />
      <div className="relative z-10 w-[95vw] md:w-full max-w-5xl bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl my-10 overflow-hidden flex flex-col">
        {/* Cover Photo Area */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-blue-600/30 to-purple-600/30 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full backdrop-blur-sm transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 md:px-10 pb-10">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8 relative z-10">
            <div className="w-32 h-32 rounded-full bg-[#1a1a1f] border-4 border-[#0f0f11] flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
              {student.profile_photo || student.avatar ? (
                <img src={student.profile_photo || student.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-500">{student.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-white">{student.name || 'Anonymous User'}</h2>
                {student.profile_completion >= 80 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">
                    ⭐ Top Performer
                  </span>
                )}
              </div>
              <p className="text-gray-400 font-medium text-sm md:text-base mb-4">
                {student.college} {student.branch ? `• ${student.branch}` : ''} {student.year ? `• Class of ${student.year}` : ''}
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={handleConnect}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
                {student.resume_url && (
                  <a href={student.resume_url} target="_blank" rel="noreferrer" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
                    📄 Resume
                  </a>
                )}
                {student.github_url && (
                  <a href={student.github_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white p-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                )}
                {student.linkedin_url && (
                  <a href={student.linkedin_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white p-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-white mb-3">About</h3>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {student.bio || "This student hasn't written a bio yet."}
                </div>
              </section>

              {student.skills && student.skills.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-white mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {student.skills.map((skill, i) => (
                      <span key={i} className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {student.achievements && student.achievements.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-white mb-3">Achievements</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    {student.achievements.map((ach, i) => (
                      <li key={i}>{ach}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Right Column - Members & Metadata */}
            <div className="space-y-8">
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Profile Overview</h3>
                
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Career Goal</span>
                  <span className="text-white text-sm font-medium text-right ml-4">{student.career_goal || 'Not specified'}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Experience</span>
                  <span className="text-white text-sm font-medium">{student.experience_level || 'Beginner'}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Activity Score</span>
                  <span className="text-white text-sm font-medium">{student.activity_score || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Profile Completion</span>
                  <span className="text-white text-sm font-medium">{student.profile_completion || 0}%</span>
                </div>
                
                <div className="w-full bg-black/50 rounded-full h-2 mt-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${student.profile_completion || 0}%` }}></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
