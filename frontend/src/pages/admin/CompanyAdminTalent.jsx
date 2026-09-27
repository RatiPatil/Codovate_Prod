import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, MapPin, Briefcase, GraduationCap, Link as LinkIcon, ExternalLink, Calendar, Video, CheckCircle, Code, FileText, Target, Brain, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import CandidateProfileModal from '../../components/modals/CandidateProfileModal';

const CompanyAdminTalent = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '', link: '', message: '' });

  // Basic Filters
  const [skillFilter, setSkillFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    branch: '',
    year: '',
    location: '',
    experience_level: '',
    resume_score: '',
    coding_score: '',
    project_count: '',
    availability: false
  });

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
          branch: advancedFilters.branch || undefined,
          year: advancedFilters.year || undefined,
          location: advancedFilters.location || undefined,
          experience_level: advancedFilters.experience_level || undefined,
          resume_score: advancedFilters.resume_score || undefined,
          coding_score: advancedFilters.coding_score || undefined,
          project_count: advancedFilters.project_count || undefined,
          availability: advancedFilters.availability ? 'true' : undefined
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
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Filters
          </button>
          <button 
            onClick={fetchTalent}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded-xl transition-colors"
          >
            Search
          </button>
        </div>
      </div>
      
      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-[#0a0a16] border border-white/10 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Branch</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none" placeholder="e.g. Computer Science" value={advancedFilters.branch} onChange={e => setAdvancedFilters({...advancedFilters, branch: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Graduation Year</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none" placeholder="e.g. 2026" value={advancedFilters.year} onChange={e => setAdvancedFilters({...advancedFilters, year: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none" placeholder="e.g. New York" value={advancedFilters.location} onChange={e => setAdvancedFilters({...advancedFilters, location: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Experience Level</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none" value={advancedFilters.experience_level} onChange={e => setAdvancedFilters({...advancedFilters, experience_level: e.target.value})}>
              <option value="">Any</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Resume Score</label>
            <input type="number" min="0" max="100" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none" placeholder="e.g. 70" value={advancedFilters.resume_score} onChange={e => setAdvancedFilters({...advancedFilters, resume_score: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Coding Score</label>
            <input type="number" min="0" max="100" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none" placeholder="e.g. 80" value={advancedFilters.coding_score} onChange={e => setAdvancedFilters({...advancedFilters, coding_score: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Project Count</label>
            <input type="number" min="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 focus:outline-none" placeholder="e.g. 3" value={advancedFilters.project_count} onChange={e => setAdvancedFilters({...advancedFilters, project_count: e.target.value})} />
          </div>
          <div className="flex items-center mt-6">
            <label className="flex items-center cursor-pointer gap-2">
              <input type="checkbox" className="form-checkbox text-amber-500 rounded bg-white/5 border-white/10 focus:ring-amber-500" checked={advancedFilters.availability} onChange={e => setAdvancedFilters({...advancedFilters, availability: e.target.checked})} />
              <span className="text-sm font-bold text-white">Actively Looking Only</span>
            </label>
          </div>
        </div>
      )}

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
                {candidate.readiness?.readinessScore > 75 && (
                  <span className="absolute top-4 left-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle size={12} /> Verified Ready
                  </span>
                )}
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
        <CandidateProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onShortlist={toggleShortlist}
        />
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
