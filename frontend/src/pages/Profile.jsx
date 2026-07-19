import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProfileReadOnlyView from '../components/ProfileReadOnlyView';
import MilestoneModal from '../components/MilestoneModal';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import { uploadProfilePhoto, uploadResume } from '../utils/storageUtils';
import { formatDistanceToNow } from 'date-fns';
import SkeletonLoader from '../components/common/SkeletonLoader';
const ALL_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'TypeScript',
  'Flutter', 'Kotlin', 'Swift', 'Machine Learning', 'TensorFlow',
  'Figma', 'Photoshop', 'Linux', 'GraphQL', 'Next.js', 'Django', 'Vue.js',
];

const ALL_DESIRED_ROLES = [
  'AI Engineer', 'Machine Learning Engineer', 'Data Scientist', 'Data Analyst',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile App Developer',
  'Flutter Developer', 'Android Developer', 'iOS Developer', 'UI/UX Designer',
  'Product Designer', 'DevOps Engineer', 'Cloud Engineer', 'Cyber Security Enthusiast',
  'Ethical Hacker', 'Blockchain Developer', 'Game Developer', 'AR/VR Developer',
  'IoT Developer', 'Software Engineer', 'Researcher', 'Entrepreneur',
  'Startup Founder', 'Product Manager', 'Technical Writer', 'Open Source Contributor',
  'Competitive Programmer',
];

const Section = ({ title, icon, isEditing, onEdit, onSave, onCancel, children, saving }) => (
  <div className="glass-panel rounded-2xl p-5 md:p-8 relative w-full mb-6">
    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
      <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-3 text-lg">
        <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">{icon}</span> {title}
      </h3>
      {!isEditing ? (
        <button onClick={onEdit} className="text-primary hover:text-primary-light text-sm font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Edit
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 transition">Cancel</button>
          <button onClick={onSave} disabled={saving} className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-primary-light transition flex items-center gap-2">
            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
          </button>
        </div>
      )}
    </div>
    {children}
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [activities, setActivities] = useState([]);
  
  // Edit state (which section is active)
  const [editingSection, setEditingSection] = useState(null);
  
  // Local Form State
  const [form, setForm] = useState({
    name: '', email: '', college: '', branch: '', year: '', bio: '', 
    github_url: '', linkedin_url: '', avatar_url: '', resume_url: '', portfolio_url: ''
  });
  
  // Complex fields state
  const [skills, setSkills] = useState([]);
  const [desiredRoles, setDesiredRoles] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [seeking, setSeeking] = useState([]);
  const [passionateAbout, setPassionateAbout] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const { linkGoogleAccount } = useAuth();
  const [linking, setLinking] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showMilestone, setShowMilestone] = useState(false);
  
  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  
  // Upload states
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);

  // Custom inputs state for specific sections
  const [customRole, setCustomRole] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const fetchProfile = useCallback(() => {
    api.get('/students/profile').then(res => {
      const d = res.data;
      setProfileData(d);
      setForm({
        name: d.name || '',
        email: d.email || '',
        college: d.college || '',
        branch: d.branch || '',
        year: d.year || '',
        bio: d.bio || '',
        github_url: d.github_url || '',
        linkedin_url: d.linkedin_url || '',
        avatar_url: d.avatar_url || '',
        resume_url: d.resume_url || '',
        portfolio_url: d.portfolio_url || ''
      });
      setSkills(Array.isArray(d.skills) ? d.skills : []);
      setDesiredRoles(Array.isArray(d.desired_roles) ? d.desired_roles : []);
      setAchievements(Array.isArray(d.achievements) ? d.achievements : []);
      setSeeking(Array.isArray(d.seeking) ? d.seeking : []);
      setPassionateAbout(Array.isArray(d.passionate_about) ? d.passionate_about : []);
      setProjects(Array.isArray(d.projects) ? d.projects : []);
      setCertificates(Array.isArray(d.certificates) ? d.certificates : []);
      
      if (d.profile_completion === 100 && localStorage.getItem('milestone_100_shown') !== 'true') {
        setShowMilestone(true);
        localStorage.setItem('milestone_100_shown', 'true');
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fetchActivity = useCallback(() => {
    api.get('/students/activity')
      .then(res => setActivities(res.data.activities || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchActivity();
  }, [fetchProfile, fetchActivity]);

  const handleSaveSection = async (sectionKey) => {
    if (sectionKey === 'personal' && (!form.name || form.name?.trim().length < 3)) {
      showToast('Full name must be at least 3 characters.', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        skills, 
        desired_roles: desiredRoles, 
        achievements, 
        seeking, 
        passionate_about: passionateAbout,
        projects,
        certificates
      };
      await api.put('/students/profile', payload);
      showToast('Profile updated successfully! ✅', 'success');
      setEditingSection(null);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinking(true);
    try {
      await linkGoogleAccount();
      showToast('Google Account linked successfully! ✅', 'success');
      fetchProfile();
    } catch (err) {
      if (err.code === 'auth/credential-already-in-use') {
        showToast('This Google account is already linked to another Codovate profile.', 'error');
      } else {
        showToast(err.message || 'Failed to link account.', 'error');
      }
    } finally {
      setLinking(false);
    }
  };

  const onAvatarSelected = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File too large (max 5MB)', 'error');
        return;
      }
      const src = URL.createObjectURL(file);
      setImageToCrop(src);
      setShowCropper(true);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob) => {
    try {
      showToast('Uploading profile photo...', 'success');
      const url = await uploadProfilePhoto(croppedBlob, user.uid);
      setForm(prev => ({ ...prev, avatar_url: url }));
      
      // Auto save after upload
      await api.put('/students/profile', { avatar_url: url });
      showToast('Profile photo updated! ✅', 'success');
      fetchProfile();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload photo.', 'error');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File too large (max 10MB)', 'error');
        return;
      }
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are allowed.', 'error');
        return;
      }
      
      try {
        setUploadingResume(true);
        const url = await uploadResume(file, user.uid, (prog) => setResumeProgress(prog));
        setForm(prev => ({ ...prev, resume_url: url }));
        
        // Auto save
        await api.put('/students/profile', { resume_url: url });
        showToast('Resume uploaded successfully! ✅', 'success');
        fetchProfile();
      } catch (err) {
        console.error(err);
        showToast('Failed to upload resume.', 'error');
      } finally {
        setUploadingResume(false);
        setResumeProgress(0);
      }
    }
    e.target.value = '';
  };

  const getMissingItems = () => {
    const items = [];
    if (!form.bio) items.push({ label: 'Add a short bio', boost: 10 });
    if (!form.college) items.push({ label: 'Add your college', boost: 10 });
    if (skills.length === 0) items.push({ label: 'Add your top skills', boost: 10 });
    if (!form.resume_url) items.push({ label: 'Upload your Resume', boost: 10 });
    if (projects.length === 0) items.push({ label: 'Add at least one Project', boost: 10 });
    return items;
  };

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto pt-8">
      <SkeletonLoader type="card" count={3} />
    </div>
  );

  const renderViewText = (val, placeholder = 'Not provided') => {
    return val ? <span className="text-gray-800 dark:text-gray-200">{val}</span> : <span className="text-gray-400 italic text-sm">{placeholder}</span>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto relative z-10">
      <ImageCropperModal
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
      <MilestoneModal 
        isOpen={showMilestone} 
        onClose={() => setShowMilestone(false)} 
        title="100% Profile Complete"
        description="You've unlocked the ultimate builder status."
      />
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl glass-panel ${
          toast.type === 'success'
            ? 'border-green-500/30 text-green-400 bg-green-500/5'
            : 'border-red-500/30 text-red-400 bg-red-500/5'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
            <span className="text-gradient">My Profile</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your identity and track your growth.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Read Only & Progress */}
        <div className="w-full lg:col-span-4 space-y-6">
          <ProfileReadOnlyView
            isOwner={true}
            user={{ ...profileData, ...form, skills, desired_roles: desiredRoles, achievements, seeking, passionate_about: passionateAbout, projects, certificates }}
            onAvatarChange={onAvatarSelected}
            getMissingItems={getMissingItems}
            onEditClick={() => setEditingSection('personal')}
            onShareClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url).then(() => showToast('Profile link copied!', 'success'));
            }}
            linking={linking}
            onLinkGoogle={handleLinkGoogle}
            theme={theme}
            toggleTheme={toggleTheme}
          />
          
          {/* Activity History Feed */}
          <div className="glass-panel rounded-2xl p-6 relative w-full">
            <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2"><span className="text-xl">📈</span> Activity History</h3>
            {activities.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {activities.map((act, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white/20 bg-gray-900 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                      <div className="font-bold text-gray-200">{act.title}</div>
                      <div className="text-gray-400 text-xs mt-1">{formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">No activity recorded yet. Start applying!</div>
            )}
          </div>
        </div>

        {/* Right Content - Editable Sections */}
        <div className="w-full lg:col-span-8 space-y-6 pb-20">
          
          {/* Personal Section */}
          <Section 
            title="Personal & Education" icon="👤" 
            isEditing={editingSection === 'personal'} 
            onEdit={() => setEditingSection('personal')} 
            onSave={() => handleSaveSection('personal')} 
            onCancel={() => { setEditingSection(null); fetchProfile(); }} 
            saving={saving}
          >
            {editingSection === 'personal' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value.toUpperCase()})} className="input-glass w-full text-sm" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Email</label>
                    <input type="email" value={form.email} disabled className="input-glass w-full text-sm opacity-50 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="input-glass w-full text-sm h-20 resize-none" placeholder="A short bio..." />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">College</label>
                    <input type="text" value={form.college} onChange={e => setForm({...form, college: e.target.value})} className="input-glass w-full text-sm" placeholder="University Name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Branch/Major</label>
                    <input type="text" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} className="input-glass w-full text-sm" placeholder="Computer Science" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Year</label>
                    <select value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="input-glass w-full text-sm">
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="Graduated">Graduated</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold">Full Name</p><p className="mt-1">{renderViewText(form.name)}</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold">Email</p><p className="mt-1">{renderViewText(form.email)}</p></div>
                  <div className="col-span-2"><p className="text-[10px] text-gray-400 uppercase font-bold">Bio</p><p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{renderViewText(form.bio)}</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold">College</p><p className="mt-1">{renderViewText(form.college)}</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold">Branch & Year</p><p className="mt-1">{renderViewText(form.branch)} • {renderViewText(form.year)}</p></div>
                </div>
              </div>
            )}
          </Section>

          {/* Career Preferences */}
          <Section 
            title="Career Preferences" icon="🎯" 
            isEditing={editingSection === 'career'} 
            onEdit={() => setEditingSection('career')} 
            onSave={() => handleSaveSection('career')} 
            onCancel={() => { setEditingSection(null); fetchProfile(); }} 
            saving={saving}
          >
            {editingSection === 'career' ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Desired Roles</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {desiredRoles.map(role => (
                      <span key={role} className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-md flex items-center gap-1">
                        {role} <button onClick={() => setDesiredRoles(prev => prev.filter(r => r !== role))} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select 
                      onChange={e => { if(e.target.value && !desiredRoles.includes(e.target.value)) setDesiredRoles([...desiredRoles, e.target.value]); e.target.value=''; }} 
                      className="input-glass text-sm flex-1"
                    >
                      <option value="">Select a role...</option>
                      {ALL_DESIRED_ROLES.filter(r => !desiredRoles.includes(r)).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Desired Roles</p>
                  {desiredRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {desiredRoles.map(role => <span key={role} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-semibold">{role}</span>)}
                    </div>
                  ) : <p className="text-gray-400 italic text-sm">No roles specified.</p>}
                </div>
              </div>
            )}
          </Section>

          {/* Skills Section */}
          <Section 
            title="Skills" icon="⚡" 
            isEditing={editingSection === 'skills'} 
            onEdit={() => setEditingSection('skills')} 
            onSave={() => handleSaveSection('skills')} 
            onCancel={() => { setEditingSection(null); fetchProfile(); }} 
            saving={saving}
          >
            {editingSection === 'skills' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-primary/15 border border-primary text-primary text-xs font-bold rounded-lg flex items-center gap-1.5">
                      {skill} <button onClick={() => setSkills(prev => prev.filter(s => s !== skill))} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customSkill.trim() && !skills.includes(customSkill.trim())) {
                          setSkills([...skills, customSkill.trim()]);
                          setCustomSkill('');
                        }
                      }
                    }}
                    placeholder="Type a skill and hit enter..."
                    className="input-glass w-full text-sm flex-1"
                  />
                  <button type="button" onClick={() => {
                    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
                      setSkills([...skills, customSkill.trim()]);
                      setCustomSkill('');
                    }
                  }} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ALL_SKILLS.filter(s => !skills.includes(s)).slice(0, 15).map(skill => (
                    <button key={skill} onClick={() => setSkills([...skills, skill])} className="text-xs px-2 py-1 rounded border border-white/10 hover:border-primary text-gray-400 hover:text-primary transition">+ {skill}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => <span key={skill} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm font-medium">{skill}</span>)}
                  </div>
                ) : <p className="text-gray-400 italic text-sm">No skills added yet.</p>}
              </div>
            )}
          </Section>

          {/* Projects */}
          <Section 
            title="Projects" icon="🚀" 
            isEditing={editingSection === 'projects'} 
            onEdit={() => setEditingSection('projects')} 
            onSave={() => handleSaveSection('projects')} 
            onCancel={() => { setEditingSection(null); fetchProfile(); }} 
            saving={saving}
          >
            {editingSection === 'projects' ? (
              <div className="space-y-4 animate-fade-in">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
                    <button onClick={() => setProjects(projects.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-gray-500 hover:text-red-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    <div className="grid gap-3">
                      <input type="text" value={proj.title} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], title: e.target.value }; setProjects(p); }} placeholder="Project Title" className="input-glass text-sm font-bold" />
                      <textarea value={proj.description} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], description: e.target.value }; setProjects(p); }} placeholder="Description" className="input-glass text-sm h-16 resize-none" />
                      <input type="url" value={proj.link} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], link: e.target.value }; setProjects(p); }} placeholder="Project URL (GitHub/Live)" className="input-glass text-sm" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setProjects([...projects, { title: '', description: '', link: '' }])} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 text-sm font-bold hover:bg-white/5 hover:text-white transition">+ Add Project</button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {projects.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col h-full">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{proj.title || 'Untitled Project'}</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-xs flex-1 mb-3">{proj.description}</p>
                        {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">View Project <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-400 italic text-sm">No projects added yet.</p>}
              </div>
            )}
          </Section>

          {/* Social Links & Resume */}
          <Section 
            title="Links & Resume" icon="🔗" 
            isEditing={editingSection === 'links'} 
            onEdit={() => setEditingSection('links')} 
            onSave={() => handleSaveSection('links')} 
            onCancel={() => { setEditingSection(null); fetchProfile(); }} 
            saving={saving}
          >
            {editingSection === 'links' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">GitHub URL</label>
                    <input type="url" value={form.github_url} onChange={e => setForm({...form, github_url: e.target.value})} className="input-glass w-full text-sm" placeholder="https://github.com/..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">LinkedIn URL</label>
                    <input type="url" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} className="input-glass w-full text-sm" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Portfolio URL</label>
                    <input type="url" value={form.portfolio_url} onChange={e => setForm({...form, portfolio_url: e.target.value})} className="input-glass w-full text-sm" placeholder="https://yourwebsite.com" />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/5 mt-4">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Upload Resume (PDF)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold py-2 px-4 rounded-xl transition">
                      {uploadingResume ? `Uploading ${Math.round(resumeProgress)}%` : 'Choose File'}
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} disabled={uploadingResume} />
                    </label>
                    {form.resume_url && !uploadingResume && (
                      <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Resume Attached
                      </span>
                    )}
                  </div>
                  {form.resume_url && (
                    <div className="mt-2 text-xs text-gray-500 truncate">{form.resume_url}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in flex flex-wrap gap-3">
                {form.github_url && <a href={form.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#24292e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition"><i className="fab fa-github"></i> GitHub</a>}
                {form.linkedin_url && <a href={form.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#0077b5] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"><i className="fab fa-linkedin"></i> LinkedIn</a>}
                {form.portfolio_url && <a href={form.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"><i className="fas fa-globe"></i> Portfolio</a>}
                {form.resume_url && <a href={form.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition"><i className="fas fa-file-pdf"></i> View Resume</a>}
                {(!form.github_url && !form.linkedin_url && !form.portfolio_url && !form.resume_url) && <p className="text-gray-400 italic text-sm">No links or resume provided.</p>}
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
};

export default Profile;
