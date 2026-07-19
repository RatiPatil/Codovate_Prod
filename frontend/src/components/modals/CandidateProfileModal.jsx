import React, { useState } from 'react';
import { X, ExternalLink, Mail, Phone, MapPin, GraduationCap, Calendar, CheckCircle, Code, Briefcase, FileText, Award, Globe, Star, MessageSquare } from 'lucide-react';

const GithubIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const ProgressBar = ({ label, percentage, colorClass }) => (
  <div className="mb-4">
    <div className="flex justify-between items-end mb-1">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-white">{percentage}%</span>
    </div>
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
    </div>
  </div>
);

const CandidateProfileModal = ({ student, onClose, onShortlist }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!student) return null;

  // Calculate Sub-Scores
  const readiness = student.readiness?.details || {};
  
  const resumeScore = Math.round((readiness.resumeScore || 0) * 4) || (student.resume_url ? 85 : 40);
  const projectsScore = Math.min((student.projects?.length || 0) * 20 + (student.portfolio_url ? 20 : 0), 100) || 50;
  const codingScore = Math.round((readiness.codingScore || 0) * 4) || 60;
  const communicationScore = Math.round((readiness.interviewScore || 0) * 4) || 75; // Default if no mock interviews
  const profileScore = student.profile_completion || 80;
  
  const recruiterScore = Math.round((resumeScore + projectsScore + codingScore + communicationScore + profileScore) / 5);

  const tabs = [
    { id: 'overview', label: 'Overview & Scores' },
    { id: 'projects', label: 'Projects & Portfolio' },
    { id: 'skills', label: 'Coding & Skills' },
    { id: 'resume', label: 'Resume' }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-[#050510] border border-white/10 w-full max-w-6xl rounded-3xl relative z-10 h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header Section */}
        <div className="p-6 md:p-8 border-b border-white/5 bg-[#080812] flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shrink-0">
          
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0">
              {student.profile_photo ? (
                <img src={student.profile_photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-amber-500">{student.name.charAt(0)}</span>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-white">{student.name}</h2>
                {recruiterScore >= 80 && (
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle size={12} /> Highly Recommended
                  </span>
                )}
              </div>
              <p className="text-amber-500 font-bold mb-3">{(student.desired_roles && student.desired_roles[0]) || 'Software Engineer'}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><GraduationCap size={16}/> {student.college}</span>
                <span className="flex items-center gap-1"><Calendar size={16}/> Class of {student.year || 'N/A'}</span>
                {student.location && <span className="flex items-center gap-1"><MapPin size={16}/> {student.location}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={() => onShortlist(student)}
              className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                student.is_shortlisted 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              <Star size={18} className={student.is_shortlisted ? 'fill-amber-400' : ''} />
              {student.is_shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
            </button>
            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-white/5 bg-[#080812] shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-amber-500 text-amber-500' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Scores */}
              <div className="lg:col-span-1 space-y-6">
                
                <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target size={100} />
                  </div>
                  <h3 className="text-lg font-black text-white mb-6">Recruiter Score</h3>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 border-4 border-amber-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <span className="text-2xl font-black text-amber-500">{recruiterScore}%</span>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">
                      An AI-aggregated score indicating overall placement readiness.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <ProgressBar label="Resume Match" percentage={resumeScore} colorClass="bg-blue-500" />
                    <ProgressBar label="Projects / Portfolio" percentage={projectsScore} colorClass="bg-purple-500" />
                    <ProgressBar label="Coding Statistics" percentage={codingScore} colorClass="bg-emerald-500" />
                    <ProgressBar label="Communication (Mock)" percentage={communicationScore} colorClass="bg-pink-500" />
                    <ProgressBar label="Profile Completeness" percentage={profileScore} colorClass="bg-amber-500" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
                  {student.actively_looking !== false ? (
                    <div className="space-y-4">
                      <a href={`mailto:${student.email}`} className="flex items-center gap-3 text-white hover:text-amber-500 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0"><Mail size={16}/></div>
                        <span className="truncate">{student.email}</span>
                      </a>
                      <a href="#" className="flex items-center gap-3 text-white hover:text-amber-500 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0"><Phone size={16}/></div>
                        <span>Request Phone Number</span>
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                      <span className="text-red-400">🔒</span>
                      <p className="text-xs text-red-400 font-medium leading-relaxed">
                        This candidate is currently not actively looking for opportunities. Contact information is hidden.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Bio & Highlights */}
              <div className="lg:col-span-2 space-y-8">
                
                <div>
                  <h3 className="text-xl font-black text-white mb-4">About the Candidate</h3>
                  <p className="text-gray-300 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10">
                    {student.bio || "No bio provided."}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white mb-4">Verified Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(student.skills || []).map((skill, index) => (
                      <span key={index} className="px-4 py-2 bg-[#101018] border border-white/10 rounded-xl text-sm font-medium text-gray-300 flex items-center gap-2">
                        {skill} <CheckCircle size={14} className="text-emerald-500" />
                      </span>
                    ))}
                    {(!student.skills || student.skills.length === 0) && (
                      <p className="text-gray-500 italic">No skills listed.</p>
                    )}
                  </div>
                </div>

                {/* External Links Summary */}
                <div>
                  <h3 className="text-xl font-black text-white mb-4">Profiles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {student.github_url && (
                      <a href={student.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                        <GithubIcon size={24} className="text-gray-400 group-hover:text-white" />
                        <div>
                          <p className="text-sm font-bold text-white">GitHub</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">View Profile <ExternalLink size={10}/></p>
                        </div>
                      </a>
                    )}
                    {student.linkedin_url && (
                      <a href={student.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-[#0077b5]/20 border border-white/10 hover:border-[#0077b5]/50 rounded-xl transition-all group">
                        <div className="w-6 h-6 rounded bg-gray-400 group-hover:bg-[#0077b5] flex items-center justify-center text-[#050510] font-black text-xs">in</div>
                        <div>
                          <p className="text-sm font-bold text-white">LinkedIn</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">View Profile <ExternalLink size={10}/></p>
                        </div>
                      </a>
                    )}
                    {student.portfolio_url && (
                      <a href={student.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                        <Globe size={24} className="text-gray-400 group-hover:text-white" />
                        <div>
                          <p className="text-sm font-bold text-white">Portfolio</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">View Website <ExternalLink size={10}/></p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white">Project Portfolio</h3>
                {student.portfolio_url && (
                  <a href={student.portfolio_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-amber-500 hover:text-amber-400 flex items-center gap-2">
                    View Live Portfolio <ExternalLink size={14} />
                  </a>
                )}
              </div>
              
              {student.projects && student.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {student.projects.map((proj, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-white">{proj.title}</h4>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-amber-500">
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed">{proj.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {(proj.techStack || []).map((tech, i) => (
                          <span key={i} className="text-xs font-medium px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-gray-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10">
                  <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No projects listed yet.</p>
                </div>
              )}
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black text-white mb-6">Coding Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#101018] border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-black text-amber-500 mb-1">{codingScore}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Codovate Coding Score</div>
                  </div>
                  <div className="bg-[#101018] border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-black text-white mb-1">{(student.stats?.problemsSolved || 0)}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Problems Solved</div>
                  </div>
                  <div className="bg-[#101018] border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-3xl font-black text-white mb-1">{(student.stats?.streak || 0)} <span className="text-sm">Days</span></div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Streak</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white mb-6">Certificates & Badges</h3>
                {student.certificates && student.certificates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {student.certificates.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Award size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{cert.title}</p>
                          <p className="text-xs text-gray-500">{cert.issuer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-gray-400">No certificates added.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESUME TAB */}
          {activeTab === 'resume' && (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              {student.resume_url ? (
                <div className="w-full h-full flex flex-col items-center">
                   <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-8 mb-6 text-center">
                     <FileText size={64} className="mx-auto text-amber-500 mb-6" />
                     <h3 className="text-2xl font-black text-white mb-2">Resume Available</h3>
                     <p className="text-gray-400 mb-8">This candidate has uploaded a resume. It scored an ATS match of {resumeScore}%.</p>
                     <a 
                      href={student.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg"
                     >
                       Download Resume PDF <ExternalLink size={18} />
                     </a>
                   </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 max-w-md w-full">
                  <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 font-bold mb-2">No Resume Found</p>
                  <p className="text-sm text-gray-500">This candidate has not uploaded a resume to their profile yet.</p>
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileModal;
