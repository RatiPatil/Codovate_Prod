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
  Globe
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
  const [connectionsData, setConnectionsData] = useState({ connections: [], incomingRequests: [], outgoingRequests: [] });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [teamActivities, setTeamActivities] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Message Sending
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Modals
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMatchExplanation, setSelectedMatchExplanation] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

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

  // ── 1. Fetch Top Matches, My Teams, Connections, and Explore Teams ──────────
  const fetchDashboardData = async () => {
    try {
      setLoadingMatches(true);
      setLoadingTeams(true);

      const [resMatches, resMyTeams, resExplore, resConn] = await Promise.all([
        api.get('/teams/matches').catch(() => ({ data: [] })),
        api.get('/teams/my').catch(() => ({ data: [] })),
        api.get('/teams/all').catch(() => ({ data: [] })),
        api.get('/connections/my').catch(() => ({ data: { connections: [], incomingRequests: [], outgoingRequests: [] } }))
      ]);

      setMatches(resMatches.data || []);
      setMyTeams(resMyTeams.data || []);
      setExploreTeams(resExplore.data || []);
      setConnectionsData(resConn.data || { connections: [], incomingRequests: [], outgoingRequests: [] });

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

  // ── 2. Real-Time Chat Listener for Selected Team ───────────────────────────
  useEffect(() => {
    if (!selectedTeam?.id) return;

    // Fetch initial messages via REST API
    api.get(`/teams-chat/${selectedTeam.id}`)
      .then(res => setChatMessages(res.data || []))
      .catch(() => setChatMessages([]));

    // Fetch team activity
    api.get(`/teams-chat/${selectedTeam.id}/activity`)
      .then(res => setTeamActivities(res.data || []))
      .catch(() => setTeamActivities([]));

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
      await api.post('/connections/request', { targetUserId });
      showAlert('Connection request sent!');
      setMatches(prev => prev.map(m => m.id === targetUserId ? { ...m, connectionStatus: 'request_sent' } : m));
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
      fetchDashboardData();
      if (res.data) setSelectedTeam(res.data);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const categories = ['All', 'Web Dev', 'AI/ML', 'Mobile App', 'Design', 'DevOps'];

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-[#0F172A] p-4 md:p-8 max-w-[1700px] mx-auto space-y-6 font-sans">
      
      {/* ── BREADCRUMB & PAGE HEADER ────────────────────────────────────────── */}
      <div className="space-y-4">
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
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-medium"
              />
            </div>

            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Filter className="w-4 h-4 text-[#64748B]" />
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: MATCHES, MY TEAMS, DISCOVERY (~70%) */}
        <div className="xl:col-span-8 space-y-8">
          
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
              <span className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer">View all</span>
            </div>

            {loadingMatches ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[260px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 animate-pulse h-64" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="p-8 text-center bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-2xl space-y-2">
                <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p className="text-xs font-bold text-[#0F172A]">No complementary matches found yet</p>
                <p className="text-[11px] text-[#64748B]">Complete your skills and career goals in your profile to unlock student matches.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {matches.map((student) => (
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
                          <span>{student.location}</span>
                        </p>
                      </div>

                      {/* Skill Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {student.skills.map(s => (
                          <span key={s} className="bg-[#F3E8FF] border border-[#E9D5FF] text-[#7C3AED] text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))}
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
                { id: 'my_teams', label: 'My Teams', count: myTeams.length },
                { id: 'invites', label: 'Team Invites', count: 0 },
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
                {myTeams.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-xl space-y-3">
                    <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <p className="text-xs font-bold text-[#0F172A]">You have not joined any teams yet</p>
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl"
                    >
                      + Create Your First Team
                    </button>
                  </div>
                ) : (
                  myTeams.map(team => (
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
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold border-2 border-white flex items-center justify-center">
                              M
                            </div>
                          ))}
                          <span className="text-[11px] font-bold text-[#64748B] pl-3">
                            {team.member_count || 1} Members
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT 2: TEAM INVITES */}
            {activeTab === 'invites' && (
              <div className="space-y-3">
                <div className="p-8 text-center bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-xl text-xs text-[#64748B]">
                  No pending team invites right now.
                </div>
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
                          {conn.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">{conn.name}</p>
                          <p className="text-[11px] text-[#64748B]">{conn.role} • {conn.college || 'Engineering'}</p>
                        </div>
                      </div>

                      <button className="px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#2563EB] hover:text-white rounded-lg text-xs font-bold transition-all">
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
                <p className="text-xs text-[#64748B]">Create your team profile and let others find you</p>
                <div className="space-y-1.5 pt-2 text-xs text-[#334155] font-medium">
                  <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#7C3AED]" /> Showcase your skills</p>
                  <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#7C3AED]" /> Find perfect matches</p>
                  <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#7C3AED]" /> Build amazing projects</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="w-full bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                Create Profile
              </button>
            </div>

            {/* Explore Teams Categories */}
            <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0F172A]">Explore Teams</h3>
                <span className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer">View all</span>
              </div>
              <p className="text-xs text-[#64748B]">Browse open teams looking for members</p>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { name: 'Web Dev', count: '24 teams', icon: Globe },
                  { name: 'AI/ML', count: '18 teams', icon: Sparkles },
                  { name: 'Mobile App', count: '15 teams', icon: FileText },
                  { name: 'Design', count: '12 teams', icon: Folder },
                  { name: 'DevOps', count: '8 teams', icon: CheckSquare }
                ].map(cat => {
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.name} className="flex flex-col items-center text-center p-3 bg-[#FAFBFF] border border-[#E2E8F0] hover:border-[#7C3AED] rounded-xl transition-all cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center mb-2">
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#0F172A]">{cat.name}</span>
                      <span className="text-[10px] text-[#64748B]">{cat.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: WORKSPACE & REAL-TIME TEAM CHAT (~30%) */}
        <div className="xl:col-span-4 space-y-6 sticky top-24">
          
          {/* CHAT / WORKSPACE CONTAINER */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF] font-extrabold flex items-center justify-center text-base">
                  {selectedTeam?.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A] truncate max-w-[140px]">
                    {selectedTeam?.name || 'Campus Connect'}
                  </h3>
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                    <span>{selectedTeam?.member_count || 6} members</span>
                    <span>•</span>
                    <span className="text-[#16A34A] font-bold">Active now</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[#64748B]">
                <button className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"><MessageSquare className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"><Phone className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"><Info className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Right Panel Tabs */}
            <div className="flex items-center gap-4 text-xs font-bold border-b border-[#E2E8F0] pb-2">
              {['chat', 'files', 'tasks', 'about'].map(t => (
                <button
                  key={t}
                  onClick={() => setRightTab(t)}
                  className={`capitalize pb-1 transition-all ${
                    rightTab === t ? 'text-[#7C3AED] border-b-2 border-[#7C3AED]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Messages Display */}
            {rightTab === 'chat' && (
              <div className="space-y-4">
                <div className="h-[340px] overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                  {chatMessages.length === 0 ? (
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
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={e => setNewMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#FAFBFF] border border-[#E2E8F0] focus:border-[#7C3AED] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                  />
                  <button type="button" className="p-2 text-[#64748B] hover:text-[#7C3AED]"><Paperclip className="w-4 h-4" /></button>
                  <button
                    type="submit"
                    disabled={sendingMsg || !newMessageText.trim()}
                    className="p-2.5 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white rounded-xl hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {rightTab !== 'chat' && (
              <div className="h-[340px] flex items-center justify-center text-xs text-[#64748B]">
                {rightTab.toUpperCase()} content for {selectedTeam?.name || 'this team'}.
              </div>
            )}

          </div>

          {/* TEAM ACTIVITY FEED */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#0F172A]">Team Activity</h4>
              <span className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer">View all</span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: 'Rohit Sharma', act: 'uploaded a file API_Documentation.pdf', time: '2h ago', icon: FileText },
                { name: 'Srushti Patil', act: 'completed a task Design Homepage Mockup', time: '3h ago', icon: CheckCircle }
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#FAFBFF] transition-colors">
                    <div className="p-2 rounded-lg bg-[#F3E8FF] text-[#7C3AED] shrink-0">
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#0F172A] font-medium">
                        <strong className="font-bold">{item.name}</strong> {item.act}
                      </p>
                      <span className="text-[10px] text-[#94A3B8]">{item.time}</span>
                    </div>
                  </div>
                );
              })}
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
              <button onClick={() => setShowCreateTeamModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#475569] mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. CodeCrafters"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Project Title</label>
                <input
                  type="text"
                  value={teamForm.project_title}
                  onChange={e => setTeamForm(p => ({ ...p, project_title: e.target.value }))}
                  placeholder="e.g. AI Code Review Tool"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] mb-1">Category</label>
                  <select
                    value={teamForm.category}
                    onChange={e => setTeamForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs"
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
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs"
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
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] mb-1">Description</label>
                <textarea
                  rows="3"
                  value={teamForm.description}
                  onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your project goal..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateTeamModal(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={creatingTeam} className="px-5 py-2 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white rounded-xl font-bold">
                  {creatingTeam ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
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
              <button onClick={() => setSelectedMatchExplanation(null)} className="text-[#64748B] hover:text-[#0F172A] font-bold">✕</button>
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs py-2 rounded-xl"
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
