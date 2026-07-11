import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, ShieldCheck, AlertCircle, Ban, TrendingUp, Briefcase } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';
import StudentDataTable from '../../components/admin/StudentDataTable';
import StudentProfileModal from '../../components/admin/StudentProfileModal';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, gradientClass }) => (
  <div className="bg-[#0A0A10] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientClass} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-black text-white">{value}</p>
        {subtitle && <p className={`text-xs mt-2 ${colorClass}`}>{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-white/5 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const SuperAdminStudents = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Modals
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState({ title: '', message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes] = await Promise.all([
        api.get('/admin/students/dashboard'),
        api.get('/admin/students')
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load student data.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (id) => {
    try {
      const res = await api.get(`/admin/students/${id}`);
      setStudentDetails(res.data);
      setSelectedStudentId(id);
      setIsProfileModalOpen(true);
    } catch (err) {
      showAlert("Failed to load student profile");
    }
  };

  const handleStatusChange = async (id, action) => {
    let confirmMsg = "";
    let payload = {};

    if (action === 'suspend') {
      confirmMsg = "Are you sure you want to suspend this student? They won't be able to log in.";
      payload = { status: 'suspended' };
    } else if (action === 'restore') {
      confirmMsg = "Are you sure you want to reactivate this student?";
      payload = { status: 'active' };
    } else if (action === 'verify') {
      confirmMsg = "Are you sure you want to verify this student?";
      payload = { is_verified: true, status: 'active' };
    } else if (action === 'delete') {
      confirmMsg = "Are you sure you want to permanently delete this student?";
      payload = { status: 'deleted' };
    }

    const confirmed = await showConfirm(confirmMsg);
    if (!confirmed) return;

    try {
      await api.put(`/admin/students/${id}/status`, payload);
      showAlert(`Student ${action}ed successfully`);
      fetchData(); // Refresh list
      
      // If modal is open for this user, refresh their details too
      if (isProfileModalOpen && selectedStudentId === id) {
        handleViewStudent(id);
      }
    } catch (err) {
      showAlert(`Failed to ${action} student`);
    }
  };

  const handleBulkAction = async (ids, action) => {
    const confirmed = await showConfirm(`Are you sure you want to bulk ${action} ${ids.length} students?`);
    if (!confirmed) return;

    try {
      await api.post('/admin/students/bulk-action', { studentIds: ids, action });
      showAlert(`Bulk ${action} completed`);
      fetchData();
    } catch (err) {
      showAlert(`Failed to execute bulk ${action}`);
    }
  };

  const openNotifyModal = (id) => {
    setSelectedStudentId(id);
    setNotifyMsg({ title: '', message: '' });
    setIsNotifyModalOpen(true);
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/students/${selectedStudentId}/notify`, notifyMsg);
      showAlert("Notification sent!");
      setIsNotifyModalOpen(false);
    } catch (err) {
      showAlert("Failed to send notification");
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const charts = stats?.charts || { registrationGrowth: [], completionChart: [] };

  return (
    <div className="p-8 text-white space-y-8 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          Enterprise Student Management <span className="px-3 py-1 bg-[#2015FF]/10 text-[#2015FF] border border-[#2015FF]/20 rounded-lg text-sm">v2.0</span>
        </h1>
        <p className="text-gray-400">Monitor, manage, and control the entire student ecosystem from one command center.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={kpis.total || 0} subtitle={`+${kpis.newToday || 0} today`} icon={Users} colorClass="text-blue-400" gradientClass="from-blue-500 to-transparent" />
        <StatCard title="Active Students" value={kpis.active || 0} subtitle="Healthy accounts" icon={UserCheck} colorClass="text-emerald-400" gradientClass="from-emerald-500 to-transparent" />
        <StatCard title="Verified Profiles" value={kpis.verified || 0} subtitle="Passed checks" icon={ShieldCheck} colorClass="text-purple-400" gradientClass="from-purple-500 to-transparent" />
        <StatCard title="Applied Internships" value={kpis.applied || 0} subtitle="Active participants" icon={Briefcase} colorClass="text-[#2015FF]" gradientClass="from-[#2015FF] to-transparent" />
        <StatCard title="Suspended" value={kpis.suspended || 0} subtitle="Requires review" icon={Ban} colorClass="text-yellow-500" gradientClass="from-yellow-500 to-transparent" />
        <StatCard title="100% Complete" value={kpis.completeProfiles || 0} subtitle="Star profiles" icon={TrendingUp} colorClass="text-pink-400" gradientClass="from-pink-500 to-transparent" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0A0A10] p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-bold mb-6">Registration Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.registrationGrowth}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2015FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2015FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#12121A', borderColor: '#ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="students" stroke="#2015FF" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A10] p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-bold mb-6">Profile Completion Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.completionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#12121A', borderColor: '#ffffff10', borderRadius: '12px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="value" fill="#2015FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Data Table */}
      <div>
        <h3 className="text-xl font-bold mb-4">Student Directory</h3>
        <StudentDataTable 
          data={students}
          loading={loading}
          onView={handleViewStudent}
          onVerify={(id) => handleStatusChange(id, 'verify')}
          onSuspend={(id) => handleStatusChange(id, 'suspend')}
          onDelete={(id) => handleStatusChange(id, 'delete')}
          onRestore={(id) => handleStatusChange(id, 'restore')}
          onNotify={openNotifyModal}
          onBulkAction={handleBulkAction}
        />
      </div>

      {/* Profile Modal */}
      <StudentProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        studentDetails={studentDetails}
        onStatusChange={handleStatusChange}
      />

      {/* Send Notification Modal */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotifyModalOpen(false)} />
          <div className="relative bg-[#0A0A10] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[modal-slide-up_0.2s_ease-out]">
            <h3 className="text-lg font-bold mb-4 text-white">Send Direct Notification</h3>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notification Title</label>
                <input 
                  type="text" 
                  required
                  value={notifyMsg.title}
                  onChange={e => setNotifyMsg({...notifyMsg, title: e.target.value})}
                  className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#2015FF] focus:outline-none transition-colors"
                  placeholder="e.g. Profile Verification Required"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Body</label>
                <textarea 
                  required
                  rows={4}
                  value={notifyMsg.message}
                  onChange={e => setNotifyMsg({...notifyMsg, message: e.target.value})}
                  className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#2015FF] focus:outline-none transition-colors resize-none"
                  placeholder="Type your message here..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsNotifyModalOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-[#2015FF] hover:bg-blue-600 rounded-xl text-sm font-bold shadow-lg shadow-[#2015FF]/20 transition-colors">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminStudents;
