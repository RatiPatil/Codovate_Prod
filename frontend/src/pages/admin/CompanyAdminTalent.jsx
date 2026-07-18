import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, MapPin, Briefcase, GraduationCap, Link as LinkIcon, ExternalLink, Calendar, Video } from 'lucide-react';
import toast from 'react-hot-toast';

const CompanyAdminTalent = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '', link: '', message: '' });

  // Filters
  const [skillFilter, setSkillFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const toggleShortlist = async (student, e) => {
    if(e) e.stopPropagation();
    try {
      const res = await api.post(`/company-admin/talent/${student.id}/shortlist`);
      setCandidates(prev => prev.map(c => c.id === student.id ? { ...c, is_shortlisted: res.data.is_shortlisted } : c));
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(prev => ({ ...prev, is_shortlisted: res.data.is_shortlisted }));
      }
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to update shortlist status');
    }
  };

  useEffect(() => {
    fetchTalent();
  }, []);

  const fetchTalent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/company-admin/talent', {
        params: {
          skills: skillFilter || undefined,
          role: roleFilter || undefined,
        }
      });
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load talent pool');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/company-admin/interviews', {
        candidate_name: selectedStudent.name,
        role: (selectedStudent.desired_roles && selectedStudent.desired_roles[0]) || 'Software Engineer',
        date: `${scheduleData.date} ${scheduleData.time}`,
        link: scheduleData.link,
        status: 'scheduled'
      });
      
      toast.success(`Interview scheduled with ${selectedStudent.name}!`);
      setShowScheduleModal(false);
      setScheduleData({ date: '', time: '', link: '', message: '' });
    } catch (err) {
      toast.error('Failed to schedule interview');
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto relative bg-[#050510]">
      
      {/* Header & Filters */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Talent Sourcing</h1>
          <p className="text-gray-400">Discover and recruit top student developers.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Filter by skills (e.g. React, Node)..." 
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              onBlur={fetchTalent}
              onKeyDown={(e) => e.key === 'Enter' && fetchTalent()}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-500 w-full md:w-64"
            />
          </div>
          <input 
            type="text" 
            placeholder="Desired role..." 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            onBlur={fetchTalent}
            onKeyDown={(e) => e.key === 'Enter' && fetchTalent()}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500 w-full md:w-48"
          />
          <button 
            onClick={fetchTalent}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded-xl transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-12">
          <h2 className="text-xl font-bold text-white mb-2">No candidates found</h2>
          <p className="text-gray-400">Try adjusting your filters to discover more students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {candidates.map(candidate => (
            <div key={candidate.id} className="bg-[#0a0a16] border border-white/10 hover:border-amber-500/30 rounded-2xl overflow-hidden group transition-all">
              
              <div className="p-6 relative">
                {candidate.profile_score > 80 && (
                  <span className="absolute top-4 right-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold px-2 py-1 rounded-md">
                    Top Match
                  </span>
                )}
                
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-4 overflow-hidden border border-white/5">
                  {candidate.profile_photo ? (
                    <img src={candidate.profile_photo} alt={candidate.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{candidate.name.charAt(0)}</span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{candidate.name}</h3>
                <p className="text-sm text-gray-400 mb-4 flex items-center gap-2 line-clamp-1">
                  <GraduationCap size={14} /> {candidate.college}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(candidate.skills || []).slice(0, 3).map((skill, i) => (
                    <span key={i} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                  {(candidate.skills || []).length > 3 && (
                    <span className="text-xs bg-white/5 border border-white/10 text-gray-500 px-2 py-0.5 rounded">
                      +{(candidate.skills.length - 3)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={(e) => toggleShortlist(candidate, e)}
                    className={`col-span-1 border font-bold py-2 rounded-lg transition-colors text-sm ${
                      candidate.is_shortlisted 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30' 
                        : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {candidate.is_shortlisted ? '★ Shortlisted' : '☆ Shortlist'}
                  </button>
                  <button 
                    onClick={() => setSelectedStudent(candidate)}
                    className="col-span-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                  >
                    View Profile
                  </button>
                  {candidate.resume_url && (
                    <a 
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="col-span-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold py-2 rounded-lg transition-colors text-sm text-center flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} /> Download Resume
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && !showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setSelectedStudent(null)}></div>
          <div className="bg-[#080812] border border-white/10 w-full max-w-3xl rounded-3xl p-8 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button onClick={() => setSelectedStudent(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white">✕</button>

            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                {selectedStudent.profile_photo ? (
                  <img src={selectedStudent.profile_photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{selectedStudent.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-white mb-1">{selectedStudent.name}</h2>
                  <button
                    onClick={() => toggleShortlist(selectedStudent)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      selectedStudent.is_shortlisted
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={selectedStudent.is_shortlisted ? "Remove from shortlist" : "Add to shortlist"}
                  >
                    {selectedStudent.is_shortlisted ? '★' : '☆'}
                  </button>
                </div>
                <p className="text-amber-500 font-bold mb-2">{(selectedStudent.desired_roles && selectedStudent.desired_roles[0]) || 'Software Engineer'}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><GraduationCap size={16}/> {selectedStudent.college}</span>
                  <span className="flex items-center gap-1"><Calendar size={16}/> Class of {selectedStudent.year}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2 space-y-6">
                
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">About</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {selectedStudent.bio || 'This student prefers to let their code speak for itself.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills?.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">{skill}</span>
                    ))}
                  </div>
                </div>

              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Links</h3>
                  <div className="space-y-3">
                    {selectedStudent.resume_url && (
                      <a href={selectedStudent.resume_url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm text-gray-300 hover:text-amber-500 transition-colors">
                        <span className="flex items-center gap-2"><LinkIcon size={16}/> Resume</span>
                        <ExternalLink size={14}/>
                      </a>
                    )}
                    {selectedStudent.github_url && (
                      <a href={selectedStudent.github_url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm text-gray-300 hover:text-amber-500 transition-colors">
                        <span className="flex items-center gap-2"><LinkIcon size={16}/> GitHub</span>
                        <ExternalLink size={14}/>
                      </a>
                    )}
                    {selectedStudent.portfolio_url && (
                      <a href={selectedStudent.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm text-gray-300 hover:text-amber-500 transition-colors">
                        <span className="flex items-center gap-2"><LinkIcon size={16}/> Portfolio</span>
                        <ExternalLink size={14}/>
                      </a>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(217,119,6,0.3)] flex items-center justify-center gap-2"
                >
                  <Video size={18} /> Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setShowScheduleModal(false)}></div>
          <div className="bg-[#080812] border border-white/10 w-full max-w-md rounded-3xl p-8 relative z-10">
            <h2 className="text-2xl font-black text-white mb-2">Schedule Interview</h2>
            <p className="text-gray-400 text-sm mb-6">Set up a call with {selectedStudent?.name}</p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date</label>
                  <input type="date" required value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Time</label>
                  <input type="time" required value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Meeting Link (Zoom/Meet)</label>
                <input type="url" placeholder="https://meet.google.com/..." required value={scheduleData.link} onChange={e => setScheduleData({...scheduleData, link: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Message to Candidate</label>
                <textarea rows="3" placeholder="Hi there, we'd love to chat about..." required value={scheduleData.message} onChange={e => setScheduleData({...scheduleData, message: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 custom-scrollbar"></textarea>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompanyAdminTalent;
