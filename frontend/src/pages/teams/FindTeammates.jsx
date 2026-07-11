import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';
import StudentProfileModal from './StudentProfileModal';

const FindTeammates = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Filters
  const [skillFilter, setSkillFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
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
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
      </div>

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
                        <img src={student.profile_photo} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-gray-400">{student.name.charAt(0).toUpperCase()}</span>
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
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors">{student.name}</h3>
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
