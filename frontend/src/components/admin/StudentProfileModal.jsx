import React, { useState } from 'react';
import { X, Mail, Shield, ShieldOff, Ban, RotateCcw, Trash2, User, BookOpen, Briefcase, FileText, Activity, ExternalLink, Download } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';

const StudentProfileModal = ({ 
  studentDetails, // { student, applications, projects, loginHistory }
  isOpen, 
  onClose,
  onStatusChange 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !studentDetails) return null;

  const { student, applications, projects, loginHistory } = studentDetails;
  const profile = student.profile_data || {};

  const handleExportCSV = () => {
    // Generate basic CSV from student data
    const csvRows = [
      ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'College', 'Course', 'Branch', 'Year', 'Profile %'],
      [
        student.id,
        profile.name || student.name || '',
        student.email || '',
        profile.phone || student.phone || '',
        student.role || 'student',
        student.status || 'active',
        student.is_verified ? 'Yes' : 'No',
        profile.college || '',
        profile.course || '',
        profile.branch || '',
        profile.year || '',
        profile.profile_completion || 0
      ]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_${student.id}_profile.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'education', label: 'Education', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'professional', label: 'Professional', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'applications', label: 'Applications', icon: <FileText className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity & Logs', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0A0A10] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[modal-slide-up_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2015FF]/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                  <span className="text-2xl font-black text-white">{(profile.name || student.name || 'S').substring(0, 2).toUpperCase()}</span>
                </div>
              )}
              {student.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#0A0A10]" title="Verified">
                  <Shield className="w-4 h-4" />
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                {profile.name || student.name || 'Anonymous Student'}
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  student.status === 'suspended' ? 'bg-red-500/10 text-red-400' :
                  student.status === 'deleted' ? 'bg-gray-500/10 text-gray-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {student.status || 'Active'}
                </span>
              </h2>
              <div className="text-sm font-medium text-gray-400 mt-1 flex items-center gap-4">
                <span>{student.email}</span>
                {student.phone && <span>• {student.phone}</span>}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Registered: {student.created_at ? formatDateTime(student.created_at) : 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <button onClick={handleExportCSV} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              {student.status === 'active' && <button onClick={() => onStatusChange(student.id, 'suspend')} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"><Ban className="w-3.5 h-3.5"/> Suspend</button>}
              {student.status === 'suspended' && <button onClick={() => onStatusChange(student.id, 'restore')} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5"/> Reactivate</button>}
              {!student.is_verified && <button onClick={() => onStatusChange(student.id, 'verify')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"><Shield className="w-3.5 h-3.5"/> Verify</button>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex px-6 border-b border-white/5 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-[#2015FF] text-[#2015FF]' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#050508]">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-[fade-in_0.2s_ease-out]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div><span className="block text-xs text-gray-500">Full Name</span><span className="text-sm text-white font-medium">{profile.name || student.name || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">Gender</span><span className="text-sm text-white font-medium capitalize">{profile.gender || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">Date of Birth</span><span className="text-sm text-white font-medium">{profile.dob || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">Address</span><span className="text-sm text-white font-medium">{profile.address || '—'}</span></div>
                  </div>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Profile Completion</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-[#2015FF] rounded-full" style={{ width: `${profile.profile_completion || 0}%` }} />
                    </div>
                    <span className="text-2xl font-black text-white">{profile.profile_completion || 0}%</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-6">
                    {['Name', 'Email', 'Phone', 'College', 'Skills', 'Resume', 'GitHub', 'LinkedIn'].map(item => {
                      // Basic heuristic check for completion
                      const isDone = item === 'Name' ? !!(profile.name || student.name)
                                  : item === 'Email' ? !!student.email
                                  : item === 'Phone' ? !!(profile.phone || student.phone)
                                  : item === 'College' ? !!profile.college
                                  : item === 'Skills' ? (profile.skills && profile.skills.length > 0)
                                  : item === 'Resume' ? !!profile.resume_url
                                  : item === 'GitHub' ? !!profile.github_url
                                  : item === 'LinkedIn' ? !!profile.linkedin_url : false;
                      
                      return (
                        <div key={item} className={`flex items-center gap-2 text-xs font-medium ${isDone ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {isDone ? '✓' : '○'} {item}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EDUCATION */}
          {activeTab === 'education' && (
            <div className="space-y-6 animate-[fade-in_0.2s_ease-out]">
               <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#2015FF]"/> Current Education</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div><span className="block text-xs text-gray-500">College / University</span><span className="text-base text-white font-bold">{profile.college || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">Course / Degree</span><span className="text-base text-white font-bold">{profile.course || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">Branch / Specialization</span><span className="text-base text-white font-bold">{profile.branch || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">Semester</span><span className="text-base text-white font-bold">{profile.semester || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">Passing Year</span><span className="text-base text-white font-bold">{profile.year || '—'}</span></div>
                    <div><span className="block text-xs text-gray-500">CGPA / Percentage</span><span className="text-base text-white font-bold">{profile.cgpa || '—'}</span></div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: PROFESSIONAL */}
          {activeTab === 'professional' && (
            <div className="space-y-6 animate-[fade-in_0.2s_ease-out]">
              
              {/* Links */}
              <div className="flex gap-4">
                {profile.resume_url && <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors border border-white/5"><FileText className="w-4 h-4"/> View Resume</a>}
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors border border-white/5"><ExternalLink className="w-4 h-4"/> GitHub</a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors border border-white/5"><ExternalLink className="w-4 h-4"/> LinkedIn</a>}
                {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-colors border border-white/5"><ExternalLink className="w-4 h-4"/> Portfolio</a>}
              </div>

              {/* Skills */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-black text-white mb-4">Skills</h3>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-[#2015FF]/10 text-[#2015FF] border border-[#2015FF]/20 rounded-lg text-xs font-bold">{skill}</span>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No skills added yet.</p>}
              </div>

              {/* Projects */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-black text-white mb-4">Projects ({projects?.length || 0})</h3>
                {projects?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(p => (
                      <div key={p.id} className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white text-sm">{p.title}</h4>
                          {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[#2015FF] hover:text-blue-400"><ExternalLink className="w-4 h-4"/></a>}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{p.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {p.tags?.slice(0, 3).map((t, i) => (
                            <span key={i} className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No projects added yet.</p>}
              </div>

            </div>
          )}

          {/* TAB: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-4 animate-[fade-in_0.2s_ease-out]">
              <h3 className="text-sm font-black text-white mb-2">Internship Applications ({applications?.length || 0})</h3>
              
              {applications?.length > 0 ? (
                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] border-b border-white/5">
                      <tr>
                        <th className="p-4 text-xs text-gray-500 font-bold uppercase">Opportunity</th>
                        <th className="p-4 text-xs text-gray-500 font-bold uppercase">Company</th>
                        <th className="p-4 text-xs text-gray-500 font-bold uppercase">Applied Date</th>
                        <th className="p-4 text-xs text-gray-500 font-bold uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                          <td className="p-4 text-sm font-bold text-white">{app.title || 'Unknown'}</td>
                          <td className="p-4 text-sm text-gray-300">{app.company || 'Unknown'}</td>
                          <td className="p-4 text-sm text-gray-400">{app.applied_at ? formatDate(app.applied_at, { month: 'short', day: 'numeric', year: 'numeric'}) : '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              app.status === 'Selected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              app.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              app.status === 'Shortlisted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              app.status === 'Interview Scheduled' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {app.status || 'Applied'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-gray-500 font-medium">This student has not applied to any opportunities yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: ACTIVITY & LOGS */}
          {activeTab === 'activity' && (
            <div className="space-y-6 animate-[fade-in_0.2s_ease-out]">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black text-white mb-6">Login History</h3>
                
                {loginHistory?.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    {loginHistory.map((log, idx) => (
                      <div key={log.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-[#0A0A10] text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        {/* Card */}
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-white/5 bg-black/40 shadow">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-white">{log.action || 'Login'}</h4>
                            <span className="text-[10px] text-gray-500">{log.created_at ? formatDateTime(log.created_at) : '—'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-2 space-y-1">
                            {log.ip_address && <p>IP: <span className="text-gray-300">{log.ip_address}</span></p>}
                            {log.device && <p>Device: <span className="text-gray-300">{log.device}</span></p>}
                            {log.browser && log.os && <p>OS/Browser: <span className="text-gray-300">{log.os} / {log.browser}</span></p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No activity logs found.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
