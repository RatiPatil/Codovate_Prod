import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';
import StudentProfileModal from './StudentProfileModal';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const FindTeammates = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Filters
  const [skillFilter, setSkillFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamIdForMatch, setSelectedTeamIdForMatch] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
      const res = await api.get('/teams/my');
      setMyTeams(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setIsAiMode(false);
      const res = await api.get('/networking/discover', {
        params: {
          skill: skillFilter || undefined,
          desired_role: roleFilter || undefined,
        }
      });
      setStudents(res.data.data || []);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load teammates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiMatches = async () => {
    if (!selectedTeamIdForMatch) {
      showAlert('Please select a team first to find matching teammates!');
      return;
    }
    try {
      setAiLoading(true);
      setIsAiMode(true);
      const res = await api.get(`/teams/${selectedTeamIdForMatch}/recommendations`);
      // Maps recommendation structure to standard student structure
      const formattedMatches = res.data.map(m => ({
        id: m.id,
        name: m.name,
        profile_photo: m.avatar,
        skills: m.skills,
        matchScore: m.matchScore,
        ai_match_reason: `Matches ${m.matchScore}% of the team's required skills.`
      }));
      setStudents(formattedMatches);
    } catch (err) {
      console.error(err);
      showAlert('AI Match failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleConnect = async (receiverId) => {
    try {
      await api.post('/networking/connect', { receiver_id: receiverId });
      showAlert('Connection request sent!', 'success');
      // Remove student from view after sending request
      setStudents(prev => prev.filter(s => s.id !== receiverId));
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to send request');
    }
  };

  if (loading) {
    return (
      <div className="h-full pt-4">
        <SkeletonLoader type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Filter by skill (e.g. React)..." 
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          onBlur={fetchStudents}
          onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
          className="bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary w-full max-w-xs"
        />
        <input 
          type="text" 
          placeholder="Filter by desired role..." 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          onBlur={fetchStudents}
          onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
          className="bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary w-full max-w-xs"
        />
        <button 
          onClick={fetchStudents}
          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors border border-white/10"
        >
          Search
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <select 
            value={selectedTeamIdForMatch} 
            onChange={(e) => setSelectedTeamIdForMatch(e.target.value)}
            className="bg-[#12121A] text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500 max-w-[200px]"
          >
            <option value="">Select Team for AI Match</option>
            {myTeams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button 
            onClick={fetchAiMatches}
            disabled={aiLoading || !selectedTeamIdForMatch}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {aiLoading ? (
               <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
               <>🪄 AI Matchmaker</>
            )}
          </button>
        </div>
      </div>

      {isAiMode && students.length > 0 && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-200 text-sm">
          <strong>AI Matchmaker Active:</strong> Showing candidates with complementary skills tailored to your selected team's requirements.
        </div>
      )}

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl mb-4">
            👥
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Matches Found</h2>
          <p className="text-gray-400">
            We couldn't find any active students matching your criteria, or you are already connected with everyone!
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map((student) => (
              <div 
                key={student.id} 
                className="glass-panel rounded-2xl border border-white/10 hover:border-primary/30 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Header / Cover */}
                <div className="h-20 bg-gradient-to-r from-primary/20 to-purple-500/20 relative">
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[#121212] bg-gray-800 flex items-center justify-center overflow-hidden">
                      {student.profile_photo ? (
                        <img loading="lazy" decoding="async" src={student.profile_photo} alt={student.name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-gray-400">{student.name ? student.name.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                  </div>
                  {student.profile_completion >= 80 && (
                    <div className="absolute top-3 right-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      ⭐ Top Profile
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors">{student.name || 'Anonymous User'}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1 mb-3">{student.college || 'College not specified'}</p>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {student.bio || 'This student prefers to keep an air of mystery about them.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                    {(student.skills || []).slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-gray-300">
                        {skill}
                      </span>
                    ))}
                    {(student.skills || []).length > 3 && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-gray-400">
                        +{(student.skills || []).length - 3}
                      </span>
                    )}
                  </div>
                  
                  {isAiMode && student.synergy_score && (
                    <div className="mb-4 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-purple-400 uppercase">Synergy</span>
                        <span className="text-sm font-black text-purple-300">{student.synergy_score}%</span>
                      </div>
                      <p className="text-[10px] text-purple-200/70 leading-snug">{student.match_reason}</p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-black/50 rounded-full h-1.5 mb-4">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${student.profile_completion || 0}%` }}></div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleConnect(student.id)}
                      className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Connect
                    </button>
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStudent && (
        <StudentProfileModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};

export default FindTeammates;
