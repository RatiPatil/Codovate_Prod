import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import KanbanBoard from '../../components/teams/KanbanBoard';
import ActivityTimeline from '../../components/teams/ActivityTimeline';
import { LayoutDashboard, MessageSquare, Paperclip, Clock, ArrowLeft, Link as LinkIcon, Plus } from 'lucide-react';
import { showAlert } from '../../utils/uiUtils';

const Workspace = () => {
  const { id: teamId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState({
    team: null,
    stats: null,
    members: [],
    tasks: [],
    files: [],
    announcements: [],
    activity: []
  });

  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [newFile, setNewFile] = useState({ title: '', url: '' });
  const [showFileModal, setShowFileModal] = useState(false);

  useEffect(() => {
    fetchWorkspaceData();
  }, [teamId]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const [dashRes, tasksRes, filesRes, annRes, actRes] = await Promise.all([
        api.get(`/workspace/${teamId}/dashboard`),
        api.get(`/workspace/${teamId}/tasks`),
        api.get(`/workspace/${teamId}/files`),
        api.get(`/workspace/${teamId}/announcements`),
        api.get(`/workspace/${teamId}/activity`)
      ]);

      setData({
        ...dashRes.data,
        tasks: tasksRes.data,
        files: filesRes.data,
        announcements: annRes.data,
        activity: actRes.data
      });
    } catch (err) {
      console.error(err);
      showAlert('Failed to load workspace data');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      const res = await api.post(`/workspace/${teamId}/announcements`, { content: newAnnouncement });
      setData(prev => ({
        ...prev,
        announcements: [res.data, ...prev.announcements]
      }));
      setNewAnnouncement('');
      fetchActivity(); // Refresh timeline
    } catch (err) {
      showAlert('Failed to post announcement');
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!newFile.title || !newFile.url) return;
    try {
      const res = await api.post(`/workspace/${teamId}/files`, newFile);
      setData(prev => ({
        ...prev,
        files: [res.data, ...prev.files]
      }));
      setNewFile({ title: '', url: '' });
      setShowFileModal(false);
      fetchActivity(); // Refresh timeline
    } catch (err) {
      showAlert('Failed to add file link');
    }
  };

  const fetchActivity = async () => {
    const actRes = await api.get(`/workspace/${teamId}/activity`);
    setData(prev => ({ ...prev, activity: actRes.data }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { team, stats, members } = data;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 shrink-0 z-10 shadow-sm">
        <button onClick={() => navigate('/teams')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2 text-sm font-bold mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Teams
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
              {team?.logo ? (
                <img src={team.logo} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-3xl font-black text-indigo-600">{team?.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">{team?.name}</h1>
              <p className="text-slate-500 font-medium text-sm">{team?.project_title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Progress</p>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats?.progress_percentage || 0}%` }} />
                </div>
                <span className="text-xs font-bold text-emerald-600">{stats?.progress_percentage || 0}%</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 mx-2" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Members</p>
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((m, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700" title={m.name}>
                    {m.name?.charAt(0)}
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 pt-4 bg-white border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'tasks', label: 'Task Board', icon: LayoutDashboard },
          { id: 'announcements', label: 'Announcements', icon: MessageSquare },
          { id: 'files', label: 'Shared Links', icon: Paperclip },
          { id: 'activity', label: 'Timeline', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 px-2 border-b-2 font-bold transition-colors whitespace-nowrap text-sm ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-[#F8FAFC]">
        
        {/* Kanban Board */}
        {activeTab === 'tasks' && (
          <div className="absolute inset-0 p-6 overflow-hidden">
            <KanbanBoard 
              tasks={data.tasks} 
              teamId={teamId} 
              onTasksUpdate={(tasks) => setData(prev => ({ ...prev, tasks }))} 
            />
          </div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <div className="absolute inset-0 p-6 overflow-y-auto no-scrollbar max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Post Announcement</h3>
              <form onSubmit={handlePostAnnouncement}>
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none mb-4"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={!newAnnouncement.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition-all disabled:opacity-50 shadow-sm">
                    Post
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              {data.announcements.length === 0 ? (
                <p className="text-center text-slate-400 py-8 font-medium">No announcements yet.</p>
              ) : (
                data.announcements.map(ann => (
                  <div key={ann.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                          {ann.author_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{ann.author_name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(ann.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Shared Links/Files */}
        {activeTab === 'files' && (
          <div className="absolute inset-0 p-6 overflow-y-auto no-scrollbar max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">Project Resources</h2>
              <button 
                onClick={() => setShowFileModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all text-xs"
              >
                <Plus size={16} /> Add Link
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.files.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <LinkIcon size={32} className="mx-auto mb-4 opacity-50" />
                  <p>No resources shared yet. Add GitHub repos, Figma links, or Drive folders!</p>
                </div>
              ) : (
                data.files.map(file => (
                  <a 
                    key={file.id} 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 transition-all group shadow-sm hover:shadow-md flex flex-col h-full"
                  >
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors w-fit mb-4">
                      <LinkIcon size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{file.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-4 flex-1">{file.url}</p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-auto">
                      Added on {new Date(file.created_at).toLocaleDateString()}
                    </div>
                  </a>
                ))
              )}
            </div>

            {/* Add File Modal */}
            {showFileModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Add Resource Link</h3>
                  <form onSubmit={handleAddFile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                      <input 
                        type="text" 
                        required
                        value={newFile.title}
                        onChange={e => setNewFile({ ...newFile, title: e.target.value })}
                        placeholder="e.g., Backend Repo"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL</label>
                      <input 
                        type="url" 
                        required
                        value={newFile.url}
                        onChange={e => setNewFile({ ...newFile, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                      <button type="button" onClick={() => setShowFileModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs">Cancel</button>
                      <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm text-xs">Add Link</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Timeline */}
        {activeTab === 'activity' && (
          <div className="absolute inset-0 p-6 overflow-y-auto no-scrollbar max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Activity Timeline</h2>
            <ActivityTimeline activities={data.activity} />
          </div>
        )}

      </div>
    </div>
  );
};

export default Workspace;
