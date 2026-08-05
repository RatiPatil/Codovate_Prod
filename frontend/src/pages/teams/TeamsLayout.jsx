import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/uiUtils';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import {
  Users,
  Search,
  Filter,
  Plus,
  MessageSquare,
  Phone,
  Info,
  Send,
  Paperclip,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldAlert,
  X,
  FileText,
  UserCheck,
  UserPlus,
  Trash2,
  Share2,
  Folder,
  CheckSquare,
  Globe,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

const TeamsLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [activeTab, setActiveTab] = useState('my_teams'); // 'my_teams' | 'invites' | 'connections'
  const [rightTab, setRightTab] = useState('chat'); // 'chat' | 'files' | 'tasks' | 'about'
  
  const [matches, setMatches] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [exploreTeams, setExploreTeams] = useState([]);
  const [teamInvites, setTeamInvites] = useState([]);
  const [connectionsData, setConnectionsData] = useState({ connections: [], incomingRequests: [], outgoingRequests: [] });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [teamActivities, setTeamActivities] = useState([]);

  // Workspace Sub-Resources (Files, Tasks)
  const [teamFiles, setTeamFiles] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [filterState, setFilterState] = useState({
    skill: '',
    role: '',
    college: '',
    experience: ''
  });

  // Message Sending
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Modals
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMatchExplanation, setSelectedMatchExplanation] = useState(null);

  // Additional Sub-Modals
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveryCandidates, setDiscoveryCandidates] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [newFileForm, setNewFileForm] = useState({ title: '', url: '', type: 'link' });
  const [addingFile, setAddingFile] = useState(false);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title: '', description: '', priority: 'Medium', status: 'To Do' });
  const [creatingTask, setCreatingTask] = useState(false);

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State for Create Team
  const [teamForm, setTeamForm] = useState({
    name: '',
    project_title: '',
    description: '',
    category: 'Web Dev',
    required_skills: '',
    capacity: 5,
    work_mode: 'Remote'
  });
  const [creatingTeam, setCreatingTeam] = useState(false);

  const messagesEndRef = useRef(null);

  // ── 1. Fetch Top Matches, My Teams, Connections, Invites, and Explore Teams ─────
  const fetchDashboardData = async () => {
    try {
      setLoadingMatches(true);
      setLoadingTeams(true);

      const [resMatches, resMyTeams, resExplore, resConn, resInvites] = await Promise.all([
        api.get('/teams/matches').catch(() => ({ data: [] })),
        api.get('/teams/my').catch(() => ({ data: [] })),
        api.get('/teams/all').catch(() => ({ data: [] })),
        api.get('/connections/my').catch(() => ({ data: { connections: [], incomingRequests: [], outgoingRequests: [] } })),
        api.get('/teams/invites/my').catch(() => ({ data: [] }))
      ]);

      setMatches(resMatches.data || []);
      setMyTeams(resMyTeams.data || []);
      setExploreTeams(resExplore.data || []);
      setConnectionsData(resConn.data || { connections: [], incomingRequests: [], outgoingRequests: [] });
      setTeamInvites(resInvites.data || []);

      // Auto-select first team if available
      if (resMyTeams.data && resMyTeams.data.length > 0 && !selectedTeam) {
        setSelectedTeam(resMyTeams.data[0]);
      }
    } catch (err) {
      console.error('Failed to load Teams data', err);
    } finally {
      setLoadingMatches(false);
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── 2. Real-Time Chat & Workspace Data Listener for Selected Team ─────────────
  useEffect(() => {
    if (!selectedTeam?.id) return;

    // Fetch initial messages via REST API
    api.get(`/teams-chat/${selectedTeam.id}`)
      .then(res => setChatMessages(res.data || []))
      .catch(() => setChatMessages([]));

    // Fetch team activity
    api.get(`/workspace/${selectedTeam.id}/activity`)
      .catch(() => api.get(`/teams-chat/${selectedTeam.id}/activity`))
      .then(res => setTeamActivities(res.data || []))
      .catch(() => setTeamActivities([]));

    // Fetch team files
    setLoadingFiles(true);
    api.get(`/workspace/${selectedTeam.id}/files`)
      .then(res => setTeamFiles(res.data || []))
      .catch(() => setTeamFiles([]))
      .finally(() => setLoadingFiles(false));

    // Fetch team tasks
    setLoadingTasks(true);
    api.get(`/workspace/${selectedTeam.id}/tasks`)
      .then(res => setTeamTasks(res.data || []))
      .catch(() => setTeamTasks([]))
      .finally(() => setLoadingTasks(false));

    // Set up Firestore realtime listener
    try {
      const q = query(
        collection(db, 'teams', selectedTeam.id, 'messages'),
        orderBy('created_at', 'asc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            teamId: selectedTeam.id,
            senderId: data.senderId,
            senderName: data.senderName || 'Student',
            senderAvatar: data.senderAvatar || null,
            message: data.deletedAt ? 'This message was deleted.' : (data.message || ''),
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
            isDeleted: !!data.deletedAt
          };
        });
        setChatMessages(msgs);
      }, (err) => {
        console.warn('Realtime chat fallback to REST:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Realtime listener error:', err);
    }
  }, [selectedTeam?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── 3. Connection Actions ──────────────────────────────────────────────────
  const handleConnect = async (targetUserId) => {
    try {
      await api.post('/networking/connect', { targetUserId, receiver_id: targetUserId })
        .catch(() => api.post('/connections/request', { targetUserId }));
      showAlert('Connection request sent!');
      setMatches(prev => prev.map(m => m.id === targetUserId ? { ...m, connectionStatus: 'request_sent' } : m));
      setDiscoveryCandidates(prev => prev.map(c => c.id === targetUserId ? { ...c, connectionStatus: 'request_sent' } : c));
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to send request.');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post('/connections/accept', { requestId });
      showAlert('Connection accepted!');
      fetchDashboardData();
    } catch (err) {
      showAlert('Failed to accept connection.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.post('/connections/decline', { requestId });
      showAlert('Request declined.');
      fetchDashboardData();
    } catch (err) {
      showAlert('Failed to decline request.');
    }
  };

  // ── Team Invite Handlers ───────────────────────────────────────────────────
  const handleAcceptTeamInvite = async (inviteId) => {
    try {
      await api.post(`/teams/invites/${inviteId}/accept`);
      showAlert('Accepted invitation! Welcome to the team.');
      fetchDashboardData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to accept invitation.');
    }
  };

  const handleRejectTeamInvite = async (inviteId) => {
    try {
      await api.post(`/teams/invites/${inviteId}/reject`);
      showAlert('Declined invitation.');
      fetchDashboardData();
    } catch (err) {
      showAlert('Failed to decline invitation.');
    }
  };

  // ── 4. Send Message Action ─────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedTeam?.id) return;

    const msg = newMessageText.trim();
    setNewMessageText('');
    setSendingMsg(true);

    try {
      await api.post(`/teams-chat/${selectedTeam.id}`, { message: msg });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAttachFileInChat = () => {
    const fileUrl = prompt("Enter File or Image URL to attach:");
    if (!fileUrl || !fileUrl.trim()) return;
    const fileName = prompt("Enter File Name (Optional):") || "Attached Resource";

    api.post(`/teams-chat/${selectedTeam.id}`, { message: `Shared file: ${fileName}`, fileUrl, fileName })
      .then(() => showAlert('File attached to conversation!'))
      .catch(err => showAlert(err.response?.data?.message || 'Failed to attach file.'));
  };

  // ── 5. Create Team Action ──────────────────────────────────────────────────
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return showAlert('Team name is required.');

    setCreatingTeam(true);
    try {
      const payload = {
        name: teamForm.name,
        project_title: teamForm.project_title,
        description: teamForm.description,
        category: teamForm.category,
        required_skills: teamForm.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        capacity: Number(teamForm.capacity),
        work_mode: teamForm.work_mode
      };

      const res = await api.post('/teams', payload);
      showAlert('Team created successfully! 🎉');
      setShowCreateTeamModal(false);
      setTeamForm({ name: '', project_title: '', description: '', category: 'Web Dev', required_skills: '', capacity: 5, work_mode: 'Remote' });
      await fetchDashboardData();
      if (res.data) setSelectedTeam(res.data);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setCreatingTeam(false);
    }
  };

  // ── 6. Discovery & "View All" Teammates Action ─────────────────────────────
  const handleOpenDiscovery = async () => {
    setShowDiscoveryModal(true);
    setLoadingDiscovery(true);
    try {
      const res = await api.get('/networking/discover');
      setDiscoveryCandidates(res.data?.data || res.data || []);
    } catch (err) {
      setDiscoveryCandidates(matches);
    } finally {
      setLoadingDiscovery(false);
    }
  };

  // ── 7. File & Resource Actions ──────────────────────────────────────────────
  const handleAddFileSubmit = async (e) => {
    e.preventDefault();
    if (!newFileForm.title.trim() || !newFileForm.url.trim() || !selectedTeam?.id) return;
    
    setAddingFile(true);
    try {
      const res = await api.post(`/workspace/${selectedTeam.id}/files`, newFileForm);
      setTeamFiles(prev => [res.data, ...prev]);
      showAlert('File resource added!');
      setShowAddFileModal(false);
      setNewFileForm({ title: '', url: '', type: 'link' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to add file.');
    } finally {
      setAddingFile(false);
    }
  };

  // ── 8. Task Actions ────────────────────────────────────────────────────────
  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !selectedTeam?.id) return;

    setCreatingTask(true);
    try {
      const res = await api.post(`/workspace/${selectedTeam.id}/tasks`, newTaskForm);
      setTeamTasks(prev => [res.data, ...prev]);
      showAlert('Task created successfully!');
      setShowAddTaskModal(false);
      setNewTaskForm({ title: '', description: '', priority: 'Medium', status: 'To Do' });
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    if (!selectedTeam?.id) return;
    const newStatus = task.status === 'Done' ? 'To Do' : 'Done';
    try {
      await api.put(`/workspace/${selectedTeam.id}/tasks/${task.id}`, { status: newStatus });
      setTeamTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      showAlert('Failed to update task status.');
    }
  };

  const handleCopyJoinCode = () => {
    if (!selectedTeam?.join_code) return;
    navigator.clipboard.writeText(selectedTeam.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── 9. Filter & Search Derivations ──────────────────────────────────────────
  const filteredMatches = matches.filter(student => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = student.name?.toLowerCase().includes(q);
      const matchSkill = student.skills?.some(s => (typeof s === 'string' ? s : s.name || '').toLowerCase().includes(q));
      const matchCollege = student.college?.toLowerCase().includes(q);
      const matchRole = student.role?.toLowerCase().includes(q);
      if (!matchName && !matchSkill && !matchCollege && !matchRole) return false;
    }
    if (filterState.skill && !student.skills?.some(s => (typeof s === 'string' ? s : s.name || '').toLowerCase().includes(filterState.skill.toLowerCase().trim()))) return false;
    if (filterState.college && !student.college?.toLowerCase().includes(filterState.college.toLowerCase().trim())) return false;
    if (filterState.role && !student.role?.toLowerCase().includes(filterState.role.toLowerCase().trim())) return false;
    return true;
  });

  const filteredExploreTeams = exploreTeams.filter(team => {
    if (selectedCategory !== 'All' && team.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = team.name?.toLowerCase().includes(q);
      const matchDesc = team.description?.toLowerCase().includes(q);
      const matchTitle = team.project_title?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchTitle) return false;
    }
    return true;
  });

  const filteredMyTeams = myTeams.filter(team => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return team.name?.toLowerCase().includes(q) || team.project_title?.toLowerCase().includes(q) || team.description?.toLowerCase().includes(q);
  });

  const getCategoryCountText = (catName) => {
    const count = exploreTeams.filter(t => t.category === catName).length;
    return `${count} ${count === 1 ? 'team' : 'teams'}`;
  };

  return (
    <div className="h-full min-h-0 xl:h-[calc(100vh-4.5rem)] flex flex-col bg-[#FAFBFF] text-[#0F172A] p-4 md:p-6 max-w-[1700px] mx-auto space-y-4 font-sans overflow-hidden">
      
      {/* ── BREADCRUMB & PAGE HEADER ────────────────────────────────────────── */}
      <div className="shrink-0 space-y-3">
        <div className="text-xs text-[#64748B] font-medium flex items-center gap-1.5">
          <span className="hover:text-[#0F172A] cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>Home</span>
          <span>&gt;</span>
          <span className="text-[#0F172A] font-semibold">Teams</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight">Teams</h1>
            <p className="text-[#64748B] text-sm mt-1 font-medium">
              Find teammates, build connections, and create amazing projects together.
            </p>
          </div>

          {/* Controls: Search, Filters, Create Team */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[240px] sm:min-w-[320px]">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, skills, college..."
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilterModal(true)}
              className={`flex items-center gap-2 border font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer ${
                filterState.skill || filterState.role || filterState.college ? 'bg-[#F3E8FF] border-[#7C3AED] text-[#7C3AED]' : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#9333EA] hover:opacity-95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-purple-900/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN WORKSPACE GRID ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-1 min-h-0 overflow-hidden">

        {/* LEFT COLUMN: MATCHES, MY TEAMS, DISCOVERY (~70%) */}
        <div className="xl:col-span-8 h-full min-h-0 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
          
          {/* SECTION 1 — TOP MATCHES FOR YOU */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  <h2 className="text-base font-extrabold text-[#0F172A]">Top Matches For You</h2>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                  Students with complementary skills and similar goals
                </p>
              </div>
              <button
                onClick={handleOpenDiscovery}
                className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingMatches ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[260px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 animate-pulse h-64" />
                ))}
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="p-8 text-center bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-2xl space-y-2">
                <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p className="text-xs font-bold text-[#0F172A]">No complementary matches found</p>
                <p className="text-[11px] text-[#64748B]">Try adjusting your search query or clear filters to discover more students.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {filteredMatches.map((student) => (
                  <div
                    key={student.id}
                    className="min-w-[270px] max-w-[280px] bg-white border border-[#E2E8F0] hover:border-[#7C3AED]/40 rounded-2xl p-5 space-y-3.5 shadow-sm transition-all flex-shrink-0 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Avatar & Match Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#9333EA] text-white font-extrabold text-xl flex items-center justify-center overflow-hidden shadow-md">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            student.name.charAt(0)
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                            {student.matchPercentage}% Match
                          </span>
                          <button
                            onClick={() => setSelectedMatchExplanation(student)}
                            title="Why this match?"
                            className="text-[#94A3B8] hover:text-[#7C3AED] transition-colors p-1"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A] truncate">{student.name}</h3>
                        <p className="text-xs font-semibold text-[#7C3AED] truncate">{student.role}</p>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#94A3B8] shrink-0" />
                          <span>{student.location || student.college}</span>
                        </p>
                      </div>

                      {/* Skill Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {student.skills.map(s => {
                          const skillName = typeof s === 'string' ? s : s.name || '';
                          return (
                            <span key={skillName} className="bg-[#F3E8FF] border border-[#E9D5FF] text-[#7C3AED] text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {skillName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {student.connectionStatus === 'connected' ? (
                        <button disabled className="w-full bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] rounded-xl text-xs font-bold py-2 flex items-center justify-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" /> Connected
                        </button>
                      ) : student.connectionStatus === 'request_sent' ? (
                        <button disabled className="w-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] rounded-xl text-xs font-bold py-2 flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Requested
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(student.id)}
                          className="w-full bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-xl text-xs font-bold py-2 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2 — TABBED TEAMS & CONNECTIONS VIEW */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-6">
            
            {/* TAB HEADER */}
            <div className="flex items-center gap-6 border-b border-[#E2E8F0] pb-3">
              {[
                { id: 'my_teams', label: 'My Teams', count: filteredMyTeams.length },
                { id: 'invites', label: 'Team Invites', count: teamInvites.length },
                { id: 'connections', label: 'Connections', count: connectionsData.connections.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-bold pb-2 transition-all cursor-pointer relative flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-[#7C3AED] border-b-2 border-[#7C3AED]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: MY TEAMS */}
            {activeTab === 'my_teams' && (
              <div className="space-y-3">
                {filteredMyTeams.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-xl space-y-3">
                    <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <p className="text-xs font-bold text-[#0F172A]">You have not joined any teams yet</p>
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      + Create Your First Team
                    </button>
                  </div>
                ) : (
                  filteredMyTeams.map(team => {
                    const memberCount = team.member_count || 1;
                    return (
                      <div
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer gap-4 ${
                          selectedTeam?.id === team.id
                            ? 'bg-[#F3E8FF]/30 border-[#7C3AED] shadow-sm'
                            : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF] flex items-center justify-center font-bold text-lg shrink-0">
                            {team.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#0F172A]">{team.name}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                                {team.status || 'Active'}
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B] mt-0.5">{team.project_title || team.description || 'Project collaboration'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
                          <div className="flex items-center -space-x-2">
                            {team.members && team.members.length > 0 ? (
                              team.members.slice(0, 3).map((m, idx) => (
                                <div key={m.id || idx} className="w-7 h-7 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold border-2 border-white flex items-center justify-center overflow-hidden">
                                  {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : (m.name?.charAt(0) || 'M')}
                                </div>
                              ))
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold border-2 border-white flex items-center justify-center">
                                {team.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-[#64748B] pl-3">
                              {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeam(team);
                            }}
                            className="p-1 text-[#94A3B8] hover:text-[#7C3AED] transition-colors"
                            title="Select Team Workspace"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT 2: TEAM INVITES */}
            {activeTab === 'invites' && (
              <div className="space-y-3">
                {teamInvites.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-xl text-xs text-[#64748B]">
                    No pending team invites right now.
                  </div>
                ) : (
                  teamInvites.map(invite => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-white border border-[#E2E8F0] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#7C3AED] font-bold flex items-center justify-center text-sm">
                          {invite.team_name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">{invite.team_name}</p>
                          <p className="text-[11px] text-[#64748B]">Invited by {invite.sender_name} • {invite.team_project}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectTeamInvite(invite.id)}
                          className="px-3 py-1.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptTeamInvite(invite.id)}
                          className="px-3 py-1.5 bg-[#7C3AED] text-white hover:bg-[#6D28D9] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT 3: CONNECTIONS */}
            {activeTab === 'connections' && (
              <div className="space-y-3">
                {connectionsData.connections.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-xl text-xs text-[#64748B]">
                    No active connections yet. Connect with recommended candidates above!
                  </div>
                ) : (
                  connectionsData.connections.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#7C3AED] text-white font-bold flex items-center justify-center text-sm">
                          {conn.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">{conn.name}</p>
                          <p className="text-[11px] text-[#64748B]">{conn.role || 'Student'} • {conn.college || 'Engineering'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/chat')}
                        className="px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#2563EB] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* LOWER GRID: LOOKING FOR A TEAM BANNER & EXPLORE TEAMS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Banner Card */}
            <div className="md:col-span-5 bg-gradient-to-br from-[#EFF6FF] via-[#F3E8FF] to-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#0F172A]">Looking for a Team?</h3>
                <p className="text-xs text-[#64748B]">Create your team project and let others join you</p>
                <div className="space-y-1.5 pt-2 text-xs text-[#334155] font-medium">
                  <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#7C3AED]" /> Showcase your project vision</p>
                  <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#7C3AED]" /> Find complementary skillsets</p>
                  <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#7C3AED]" /> Collaborate & build together</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="w-full bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                Create Team
              </button>
            </div>

            {/* Explore Teams Categories */}
            <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0F172A]">Explore Teams</h3>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  View all ({exploreTeams.length})
                </button>
              </div>
              <p className="text-xs text-[#64748B]">Browse open teams looking for members</p>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { name: 'Web Dev', count: getCategoryCountText('Web Dev'), icon: Globe },
                  { name: 'AI/ML', count: getCategoryCountText('AI/ML'), icon: Sparkles },
                  { name: 'Mobile App', count: getCategoryCountText('Mobile App'), icon: FileText },
                  { name: 'Design', count: getCategoryCountText('Design'), icon: Folder },
                  { name: 'DevOps', count: getCategoryCountText('DevOps'), icon: CheckSquare }
                ].map(cat => {
                  const CatIcon = cat.icon;
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                      className={`flex flex-col items-center text-center p-3 border rounded-xl transition-all cursor-pointer ${
                        isSelected ? 'bg-[#F3E8FF] border-[#7C3AED] shadow-sm' : 'bg-[#FAFBFF] border-[#E2E8F0] hover:border-[#7C3AED]'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center mb-2">
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#0F172A]">{cat.name}</span>
                      <span className="text-[10px] text-[#64748B]">{cat.count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Display Filtered Explore Teams if Category Selected */}
              {selectedCategory !== 'All' && (
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Teams in {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('All')} className="text-[#7C3AED]">Clear Category</button>
                  </div>
                  {filteredExploreTeams.length === 0 ? (
                    <p className="text-xs text-[#64748B] py-2 text-center">No open teams found in {selectedCategory}.</p>
                  ) : (
                    filteredExploreTeams.slice(0, 3).map(team => (
                      <div key={team.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">{team.name}</p>
                          <p className="text-[11px] text-[#64748B]">{team.project_title || team.description}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full">{team.capacity} Max</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: WORKSPACE & REAL-TIME TEAM CHAT (~30%) */}
        <div className="xl:col-span-4 h-full min-h-0 flex flex-col space-y-4 overflow-hidden">
          
          {/* CHAT / WORKSPACE CONTAINER */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 md:p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex-1 min-h-0 flex flex-col overflow-hidden">
            
            {/* Header (Fixed) */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF] font-extrabold flex items-center justify-center text-base">
                  {selectedTeam?.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A] truncate max-w-[140px]">
                    {selectedTeam?.name || 'Select a Team'}
                  </h3>
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                    <span>{(selectedTeam?.member_count || 1)} {(selectedTeam?.member_count || 1) === 1 ? 'member' : 'members'}</span>
                    <span>•</span>
                    <span className="text-[#16A34A] font-bold">Active</span>
                  </p>
                </div>
              </div>

              {/* Header Action Icons */}
              <div className="flex items-center gap-1 text-[#64748B]">
                <button
                  onClick={() => setRightTab('chat')}
                  title="Open Chat"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${rightTab === 'chat' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'hover:bg-[#F8FAFC]'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <div title="Voice calls disabled" className="p-2 text-[#CBD5E1] cursor-not-allowed">
                  <Phone className="w-4 h-4" />
                </div>
                <button
                  onClick={() => setRightTab('about')}
                  title="Team Info & About"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${rightTab === 'about' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'hover:bg-[#F8FAFC]'}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Panel Tabs (Fixed) */}
            <div className="shrink-0 flex items-center gap-4 text-xs font-bold border-b border-[#E2E8F0] pb-2 mb-3">
              {['chat', 'files', 'tasks', 'about'].map(t => (
                <button
                  key={t}
                  onClick={() => setRightTab(t)}
                  className={`capitalize pb-1 transition-all cursor-pointer ${
                    rightTab === t ? 'text-[#7C3AED] border-b-2 border-[#7C3AED]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* RIGHT TAB CONTENT 1: CHAT */}
            {rightTab === 'chat' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between">
                {/* Messages Container (Only this scrolls!) */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {!selectedTeam ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                      Select or create a team to start chatting.
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className="w-7 h-7 rounded-full bg-[#7C3AED] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {msg.senderName?.charAt(0) || 'U'}
                          </div>

                          <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                            <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                              <span className="font-bold text-[#0F172A]">{isMe ? 'You' : msg.senderName}</span>
                              <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>

                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isMe ? 'bg-[#F3E8FF] text-[#0F172A] rounded-tr-none' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-tl-none'
                            }`}>
                              {msg.message}
                              {msg.fileUrl && (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  <span>{msg.fileName || 'View Attachment'}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Composer (Fixed at bottom) */}
                <form onSubmit={handleSendMessage} className="shrink-0 flex items-center gap-2 pt-3 mt-2 border-t border-[#E2E8F0]">
                  <input
                    type="text"
                    disabled={!selectedTeam}
                    value={newMessageText}
                    onChange={e => setNewMessageText(e.target.value)}
                    placeholder={selectedTeam ? "Type a message..." : "Select a team first..."}
                    className="flex-1 bg-[#FAFBFF] border border-[#E2E8F0] focus:border-[#7C3AED] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!selectedTeam}
                    onClick={handleAttachFileInChat}
                    title="Attach File URL"
                    className="p-2 text-[#64748B] hover:text-[#7C3AED] cursor-pointer disabled:opacity-40"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg || !newMessageText.trim() || !selectedTeam}
                    className="p-2.5 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white rounded-xl hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* RIGHT TAB CONTENT 2: FILES */}
            {rightTab === 'files' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between">
                <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-xs font-bold text-[#0F172A]">Shared Resources ({teamFiles.length})</span>
                  <button
                    onClick={() => setShowAddFileModal(true)}
                    disabled={!selectedTeam}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:underline disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pt-2 scrollbar-thin">
                  {loadingFiles ? (
                    <p className="text-xs text-[#64748B] text-center py-8">Loading team files...</p>
                  ) : teamFiles.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-1">
                      <Folder className="w-8 h-8 text-[#94A3B8]" />
                      <p className="text-xs font-bold text-[#0F172A]">No files shared yet</p>
                      <p className="text-[11px] text-[#64748B]">Share docs, Figma links, or repos with your team.</p>
                    </div>
                  ) : (
                    teamFiles.map(file => (
                      <div key={file.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 truncate">
                          <Folder className="w-4 h-4 text-[#7C3AED] shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-[#0F172A] truncate">{file.title}</p>
                            <span className="text-[10px] text-[#64748B]">{file.type || 'link'}</span>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg shrink-0"
                          title="Open Resource"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* RIGHT TAB CONTENT 3: TASKS */}
            {rightTab === 'tasks' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between">
                <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-xs font-bold text-[#0F172A]">Team Tasks ({teamTasks.length})</span>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    disabled={!selectedTeam}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:underline disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" /> Create Task
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pt-2 scrollbar-thin">
                  {loadingTasks ? (
                    <p className="text-xs text-[#64748B] text-center py-8">Loading tasks...</p>
                  ) : teamTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-1">
                      <CheckSquare className="w-8 h-8 text-[#94A3B8]" />
                      <p className="text-xs font-bold text-[#0F172A]">No team tasks yet</p>
                      <p className="text-[11px] text-[#64748B]">Create task cards to organize your project.</p>
                    </div>
                  ) : (
                    teamTasks.map(task => (
                      <div key={task.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={task.status === 'Done'}
                              onChange={() => handleToggleTaskStatus(task)}
                              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                            <div>
                              <p className={`text-xs font-bold ${task.status === 'Done' ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'}`}>
                                {task.title}
                              </p>
                              {task.description && <p className="text-[11px] text-[#64748B]">{task.description}</p>}
                            </div>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            task.priority === 'High' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#EFF6FF] text-[#2563EB]'
                          }`}>
                            {task.priority || 'Medium'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* RIGHT TAB CONTENT 4: ABOUT */}
            {rightTab === 'about' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 text-xs pr-1 scrollbar-thin">
                {!selectedTeam ? (
                  <p className="text-xs text-[#64748B] text-center py-8">Select a team to view information.</p>
                ) : (
                  <>
                    <div className="space-y-1.5 pb-3 border-b border-[#E2E8F0]">
                      <h4 className="text-sm font-extrabold text-[#0F172A]">{selectedTeam.name}</h4>
                      <p className="text-xs font-semibold text-[#7C3AED]">{selectedTeam.project_title || 'Project Collaboration'}</p>
                      <p className="text-xs text-[#64748B]">{selectedTeam.description || 'No description provided.'}</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Category</span>
                        <span className="font-bold text-[#0F172A]">{selectedTeam.category || 'General'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Work Mode</span>
                        <span className="font-bold text-[#0F172A]">{selectedTeam.work_mode || 'Remote'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Capacity</span>
                        <span className="font-bold text-[#0F172A]">{(selectedTeam.member_count || 1)} / {(selectedTeam.capacity || 5)} Members</span>
                      </div>
                      {selectedTeam.join_code && (
                        <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-xl">
                          <div>
                            <span className="text-[10px] text-[#64748B] block font-semibold">Join Code</span>
                            <span className="font-mono font-extrabold text-sm tracking-wider text-[#7C3AED]">{selectedTeam.join_code}</span>
                          </div>
                          <button
                            onClick={handleCopyJoinCode}
                            className="p-1.5 text-[#64748B] hover:text-[#7C3AED] rounded-lg border border-[#E2E8F0] bg-white cursor-pointer"
                            title="Copy Join Code"
                          >
                            {copiedCode ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedTeam.required_skills?.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
                        <span className="text-xs font-bold text-[#0F172A] block">Required Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTeam.required_skills.map((s, i) => (
                            <span key={i} className="bg-[#F3E8FF] border border-[#E9D5FF] text-[#7C3AED] text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>

          {/* TEAM ACTIVITY FEED (Fixed at bottom of right column) */}
          <div className="shrink-0 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#0F172A]">Team Activity</h4>
              <button
                onClick={() => setShowActivityModal(true)}
                className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {teamActivities.length === 0 ? (
                <p className="text-xs text-[#94A3B8] py-2 text-center">No recent team activities recorded.</p>
              ) : (
                teamActivities.slice(0, 3).map((item, i) => (
                  <div key={item.id || i} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#FAFBFF] transition-colors">
                    <div className="p-2 rounded-lg bg-[#F3E8FF] text-[#7C3AED] shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#0F172A] font-medium">
                        <strong className="font-bold">{item.user_name || item.userName || 'Member'}</strong> {item.action} {item.details || ''}
                      </p>
                      <span className="text-[10px] text-[#94A3B8]">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── CREATE TEAM MODAL ────────────────────────────────────────────────── */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">Create New Team</h3>
              <button onClick={() => setShowCreateTeamModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#475569] mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. CodeCrafters"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Project Title</label>
                <input
                  type="text"
                  value={teamForm.project_title}
                  onChange={e => setTeamForm(p => ({ ...p, project_title: e.target.value }))}
                  placeholder="e.g. AI Code Review Tool"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] mb-1">Category</label>
                  <select
                    value={teamForm.category}
                    onChange={e => setTeamForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="Web Dev">Web Dev</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Design">Design</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#475569] mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={teamForm.capacity}
                    onChange={e => setTeamForm(p => ({ ...p, capacity: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={teamForm.required_skills}
                  onChange={e => setTeamForm(p => ({ ...p, required_skills: e.target.value }))}
                  placeholder="React, Node.js, Python"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Description</label>
                <textarea
                  rows="3"
                  value={teamForm.description}
                  onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your project goal..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateTeamModal(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-xl font-bold hover:bg-[#F8FAFC] cursor-pointer">Cancel</button>
                <button type="submit" disabled={creatingTeam} className="px-5 py-2 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white rounded-xl font-bold disabled:opacity-50 cursor-pointer">
                  {creatingTeam ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FILTER MODAL ────────────────────────────────────────────────────── */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-extrabold">Filter Candidates & Teams</h3>
              </div>
              <button onClick={() => setShowFilterModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#475569] mb-1">Filter by Skill</label>
                <input
                  type="text"
                  value={filterState.skill}
                  onChange={e => setFilterState(p => ({ ...p, skill: e.target.value }))}
                  placeholder="e.g. React, Python"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Target Role / Goal</label>
                <input
                  type="text"
                  value={filterState.role}
                  onChange={e => setFilterState(p => ({ ...p, role: e.target.value }))}
                  placeholder="e.g. Frontend Developer"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">College / Institution</label>
                <input
                  type="text"
                  value={filterState.college}
                  onChange={e => setFilterState(p => ({ ...p, college: e.target.value }))}
                  placeholder="e.g. Engineering College"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setFilterState({ skill: '', role: '', college: '', experience: '' });
                    setShowFilterModal(false);
                  }}
                  className="px-4 py-2 text-[#64748B] font-bold hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-5 py-2 bg-[#7C3AED] text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DISCOVERY & "VIEW ALL" CANDIDATES MODAL ──────────────────────────── */}
      {showDiscoveryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 text-[#0F172A] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 shrink-0">
              <div>
                <h3 className="text-base font-extrabold">All Teammate Candidates</h3>
                <p className="text-xs text-[#64748B]">Explore verified student profiles looking for collaboration</p>
              </div>
              <button onClick={() => setShowDiscoveryModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer">✕</button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {loadingDiscovery ? (
                <p className="text-xs text-[#64748B] text-center py-12">Loading candidates...</p>
              ) : discoveryCandidates.length === 0 ? (
                <p className="text-xs text-[#64748B] text-center py-12">No candidate students found.</p>
              ) : (
                discoveryCandidates.map(cand => (
                  <div key={cand.id} className="p-4 border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-4 hover:bg-[#FAFBFF]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#9333EA] text-white font-bold flex items-center justify-center text-sm">
                        {cand.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{cand.name}</h4>
                        <p className="text-[11px] text-[#7C3AED] font-semibold">{cand.career_goal || cand.desired_roles?.[0] || 'Developer'}</p>
                        <p className="text-[10px] text-[#64748B]">{cand.college || 'Engineering Student'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
                        {(cand.skills || []).slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[9px] font-bold bg-[#F3E8FF] text-[#7C3AED] px-1.5 py-0.5 rounded">
                            {typeof s === 'string' ? s : s.name}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleConnect(cand.id)}
                        className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD FILE MODAL ───────────────────────────────────────────────────── */}
      {showAddFileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-extrabold">Add Resource or Link</h3>
              <button onClick={() => setShowAddFileModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddFileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#475569] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newFileForm.title}
                  onChange={e => setNewFileForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. API Specs, Figma Design"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Resource URL *</label>
                <input
                  type="url"
                  required
                  value={newFileForm.url}
                  onChange={e => setNewFileForm(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Resource Type</label>
                <select
                  value={newFileForm.type}
                  onChange={e => setNewFileForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                >
                  <option value="link">Web Link</option>
                  <option value="doc">Document</option>
                  <option value="design">Design / Figma</option>
                  <option value="repo">GitHub / Repo</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddFileModal(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={addingFile} className="px-5 py-2 bg-[#7C3AED] text-white rounded-xl font-bold cursor-pointer">
                  {addingFile ? 'Adding...' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE TASK MODAL ────────────────────────────────────────────────── */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-extrabold">Create Team Task</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#475569] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={e => setNewTaskForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Implement Auth UI"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newTaskForm.description}
                  onChange={e => setNewTaskForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Details..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 text-xs focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] mb-1">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={e => setNewTaskForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#475569] mb-1">Status</label>
                  <select
                    value={newTaskForm.status}
                    onChange={e => setNewTaskForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={creatingTask} className="px-5 py-2 bg-[#7C3AED] text-white rounded-xl font-bold cursor-pointer">
                  {creatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ACTIVITY FEED MODAL ──────────────────────────────────────────────── */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-[#0F172A] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 shrink-0">
              <h3 className="text-base font-extrabold">Team Activity Log</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer">✕</button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {teamActivities.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-8">No activities recorded yet.</p>
              ) : (
                teamActivities.map((act, i) => (
                  <div key={act.id || i} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[#0F172A] font-medium">
                        <strong className="font-bold">{act.user_name || act.userName || 'Member'}</strong> {act.action} {act.details || ''}
                      </p>
                      <span className="text-[10px] text-[#94A3B8]">
                        {act.created_at ? new Date(act.created_at).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MATCH EXPLANATION POPOVER MODAL ──────────────────────────────────── */}
      {selectedMatchExplanation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-extrabold">Why this match?</h3>
              </div>
              <button onClick={() => setSelectedMatchExplanation(null)} className="text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-[#0F172A]">{selectedMatchExplanation.name} • {selectedMatchExplanation.matchPercentage}% Score</p>
              <div className="space-y-1.5 text-xs text-[#334155]">
                {selectedMatchExplanation.matchReasons?.map((r, i) => (
                  <p key={i} className="flex items-start gap-1.5 font-medium text-xs">
                    <span className="text-[#16A34A] font-bold">{r}</span>
                  </p>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedMatchExplanation(null)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs py-2 rounded-xl cursor-pointer hover:bg-[#F1F5F9]"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamsLayout;
