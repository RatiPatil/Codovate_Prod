import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ProjectHub = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // AI Analysis state
  // AI Analysis state
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});

  // Mentor Invite state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects/my');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEdit = (proj) => {
    setEditingProject(proj);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted.');
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project.');
    }
  };

  const handleAnalyze = async (id) => {
    setAnalyzingId(id);
    try {
      const res = await api.post(`/projects/${id}/analyze`);
      setAnalysisResults(prev => ({ ...prev, [id]: res.data.suggestions }));
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error('Failed to analyze project.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleOpenInvite = async (id) => {
    setSelectedProjectId(id);
    setInviteModalOpen(true);
    try {
      const res = await api.get('/mentors'); // Fetch active mentors
      setMentors(res.data);
    } catch (err) {
      toast.error('Failed to load mentors.');
    }
  };

  const handleSendInvite = async () => {
    if (!selectedMentorId) return toast.error('Please select a mentor.');
    setInviting(true);
    try {
      await api.post('/project-mentorships/invite', {
        project_id: selectedProjectId,
        mentor_id: selectedMentorId,
        message: inviteMessage
      });
      toast.success('Invite sent successfully!');
      setInviteModalOpen(false);
      setSelectedMentorId('');
      setInviteMessage('');
    } catch (err) {
      toast.error('Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto pt-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto relative z-10 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-gradient">Project Hub</span> 🚀
          </h1>
          <p className="text-gray-500 text-sm mt-1">Showcase your professional work, skills, and get AI feedback.</p>
        </div>
        <button onClick={handleCreate} className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(32,21,255,0.4)] transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">📂</div>
          <h3 className="text-xl font-bold text-white mb-2">No Projects Yet</h3>
          <p className="text-gray-400 text-sm max-w-md mb-6">You haven't added any projects to your portfolio. Start building your professional identity today.</p>
          <button onClick={handleCreate} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-bold text-sm border border-white/10 transition">
            Add Your First Project
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {projects.map(proj => (
            <div key={proj.id} className="glass-panel rounded-2xl p-6 flex flex-col relative group">
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleEdit(proj)} className="p-2 bg-white/10 hover:bg-primary/20 text-gray-300 hover:text-primary rounded-lg transition" title="Edit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(proj.id)} className="p-2 bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              <div className="mb-4 pr-16">
                <h3 className="text-xl font-bold text-white mb-2">{proj.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{proj.description}</p>
              </div>

              {/* Badges / Tech */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {proj.status === 'completed' ? (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-[10px] font-bold uppercase">Completed</span>
                ) : (
                  <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md text-[10px] font-bold uppercase">In Progress</span>
                )}
                {(proj.techStack || []).slice(0, 3).map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-md text-[10px] font-semibold">{tech}</span>
                ))}
                {(proj.techStack?.length > 3) && <span className="text-xs text-gray-500">+{proj.techStack.length - 3}</span>}
              </div>

              {/* Links */}
              <div className="flex items-center gap-4 mb-6 text-sm">
                {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition flex items-center gap-1.5"><i className="fab fa-github"></i> GitHub</a>}
                {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition flex items-center gap-1.5"><i className="fas fa-external-link-alt"></i> Live Demo</a>}
                <button onClick={() => handleOpenInvite(proj.id)} className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 transition ml-auto">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Invite Mentor
                </button>
              </div>

              {/* AI Analysis Section */}
              <div className="mt-auto pt-5 border-t border-white/10">
                {analysisResults[proj.id] ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                      <span>🤖</span> AI Feedback
                    </h4>
                    <ul className="space-y-2">
                      {analysisResults[proj.id].map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-primary shrink-0 mt-0.5">💡</span>
                          <span className="leading-snug">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAnalyze(proj.id)} 
                    disabled={analyzingId === proj.id}
                    className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {analyzingId === proj.id ? (
                      <><div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Analyzing...</>
                    ) : (
                      <><span>🤖</span> Get AI Feedback</>
                    )}
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      {isFormOpen && (
        <ProjectFormModal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchProjects} 
          projectToEdit={editingProject} 
        />
      )}

      {/* Invite Mentor Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f15] border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
            <h2 className="text-2xl font-bold mb-6 text-white">Invite Mentor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Mentor</label>
                <select value={selectedMentorId} onChange={e => setSelectedMentorId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary">
                  <option value="">-- Choose a Mentor --</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.name} - {m.headline}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message (Optional)</label>
                <textarea rows={3} value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} placeholder="Hi! I'd love your feedback on my project..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary resize-none"></textarea>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setInviteModalOpen(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 font-bold rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSendInvite} disabled={inviting} className="flex-1 py-2.5 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHub;
