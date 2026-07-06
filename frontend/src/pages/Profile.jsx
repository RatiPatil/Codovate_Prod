import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', college: '', branch: '', year: '',
    bio: '', resume_url: '', github_url: '', linkedin_url: '', avatar_url: ''
  });
  const [skills, setSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [desiredRoles, setDesiredRoles] = useState([]);
  const [customRole, setCustomRole] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [customAchievement, setCustomAchievement] = useState('');
  const [seeking, setSeeking] = useState([]);
  const [customSeeking, setCustomSeeking] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const { linkGoogleAccount } = useAuth();
  const [linking, setLinking] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
        resume_url: d.resume_url || '',
        github_url: d.github_url || '',
        linkedin_url: d.linkedin_url || '',
        avatar_url: d.avatar_url || ''
      });
      setSkills(Array.isArray(d.skills) ? d.skills : []);
      setDesiredRoles(Array.isArray(d.desired_roles) ? d.desired_roles : []);
      setAchievements(Array.isArray(d.achievements) ? d.achievements : []);
      setSeeking(Array.isArray(d.seeking) ? d.seeking : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const toggleSkill = (skill) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills(prev => [...prev, trimmed]);
    setCustomSkill('');
  };

  const removeSkill = (skill) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/students/profile', { ...form, skills, desired_roles: desiredRoles, achievements, seeking });
      showToast('Profile updated successfully! ✅', 'success');
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
      fetchProfile(); // refresh providers
    } catch (err) {
      // Check if it's because already linked to another account
      if (err.code === 'auth/credential-already-in-use') {
        showToast('This Google account is already linked to another Codovate profile.', 'error');
      } else {
        showToast(err.message || 'Failed to link account.', 'error');
      }
    } finally {
      setLinking(false);
    }
  };

  const getMissingItems = () => {
    const items = [];
    if (!form.bio) items.push({ label: 'Add a short bio', boost: 10 });
    if (!form.college) items.push({ label: 'Add your college', boost: 15 });
    if (skills.length === 0) items.push({ label: 'Add your top skills', boost: 20 });
    if (!form.github_url) items.push({ label: 'Link GitHub profile', boost: 10 });
    if (!form.linkedin_url) items.push({ label: 'Link LinkedIn profile', boost: 10 });
    if (!form.resume_url) items.push({ label: 'Add Resume URL', boost: 10 });
    return items;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto relative z-10">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl glass-panel ${
          toast.type === 'success'
            ? 'border-green-500/30 text-green-400 bg-green-500/5'
            : 'border-red-500/30 text-red-400 bg-red-500/5'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
            <span className="text-4xl">👤</span> <span className="text-gradient">My Profile</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Manage your Codovate identity and track your growth.</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(32,21,255,0.3)]">
             {profileData?.points || 0} Points
           </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 md:p-8 text-center relative overflow-hidden group w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />
            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    showToast('File too large (max 5MB)', 'error');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setForm({ ...form, avatar_url: ev.target.result });
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
            <label htmlFor="avatar-upload">
              <div 
                className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(32,21,255,0.2)] backdrop-blur-md relative z-10 overflow-hidden cursor-pointer group"
              >
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-all" />
                ) : (
                  <span className="text-4xl font-bold text-primary group-hover:opacity-50 transition-all">{form.name ? form.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <span className="text-[10px] uppercase font-bold text-white tracking-widest text-center">Edit<br/>Picture</span>
                </div>
              </div>
            </label>
            <h2 className="text-white font-bold text-2xl tracking-tight relative z-10">{form.name}</h2>
            <p className="text-gray-400 text-sm mt-1 relative z-10">{form.email}</p>
            {/* Desired Roles — displayed below name, center-aligned */}
            {desiredRoles.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 relative z-10">
                {desiredRoles.map(role => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-primary/10 border border-primary/25 text-primary"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    {role}
                  </span>
                ))}
              </div>
            )}
            {form.college && <p className="text-primary text-xs font-bold mt-3 bg-primary/10 border border-primary/20 inline-block px-4 py-1.5 rounded-full relative z-10">{form.college}</p>}

            <div className="mt-8 glass-card border-transparent p-5 relative z-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Profile Strength</span>
                <span className="text-xl text-primary font-black">{profileData?.profile_completion || 0}%</span>
              </div>
              <div className="h-2.5 bg-black/50 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(32,21,255,0.5)]"
                  style={{ width: `${profileData?.profile_completion || 0}%` }}
                />
              </div>
            </div>

            {getMissingItems().length > 0 && (
              <div className="mt-4 space-y-2 relative z-10 text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Boost your profile</p>
                {getMissingItems().slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-gray-300 text-xs">{item.label}</span>
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">+{item.boost}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center w-full">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Activity Score</p>
              <p className="text-3xl font-black text-white">{profileData?.activity_score || 0}</p>
            </div>
            <div className="glass-panel p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center text-center w-full">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Points</p>
              <p className="text-3xl font-black text-primary">{profileData?.points || 0}</p>
            </div>
          </div>

          {/* Achievements Section — user-selected chips */}
          <div className="glass-panel rounded-2xl p-5 md:p-6 relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-[100px] pointer-events-none" />
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">🏆</span> Achievements</h3>
            {achievements.length === 0 ? (
              <div className="text-center py-5 glass-card border-dashed">
                <p className="text-gray-400 text-xs">No achievements added yet. Edit your profile to highlight your accomplishments!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 relative z-10">
                {achievements.map(achievement => (
                  <span
                    key={achievement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-300 rounded-xl text-xs font-bold"
                  >
                    <span>🏅</span>
                    {achievement}
                  </span>
                ))}
              </div>
            )}
            {/* System badges below user achievements */}
            {profileData?.badges && profileData.badges.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 mb-2">Platform Badges</p>
                <div className="flex flex-wrap gap-2 relative z-10">
                  {profileData.badges.map(badge => (
                    <div key={badge} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl">
                      <span className="text-sm">🏆</span>
                      <span className="text-xs font-bold text-yellow-400">{badge}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Seeking Section — display chips */}
          <div className="glass-panel rounded-2xl p-5 md:p-6 relative overflow-hidden w-full">
            <div className="absolute top-0 left-0 w-28 h-28 bg-emerald-500/10 rounded-br-[100px] pointer-events-none" />
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">🤝</span> Seeking</h3>
            {seeking.length === 0 ? (
              <div className="text-center py-5 glass-card border-dashed">
                <p className="text-gray-400 text-xs">Not specified yet. Edit your profile to show who you're looking to connect with!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 relative z-10">
                {seeking.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-xl text-xs font-bold"
                  >
                    <span>🤝</span>
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div className="glass-panel rounded-2xl p-5 md:p-6 relative overflow-hidden w-full">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
              <h3 className="text-white font-bold mb-5 flex items-center gap-2 relative z-10"><span className="text-xl">⚡</span> Top Skills</h3>
              <div className="flex flex-wrap gap-2.5 relative z-10">
                {skills.map(skill => (
                  <span key={skill} className="px-3.5 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Linked Accounts */}
          <div className="glass-panel rounded-2xl p-5 md:p-6 relative overflow-hidden w-full">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">🔗</span> Linked Accounts</h3>
            <div className="space-y-3 relative z-10">
              {profileData?.providers?.includes('google') ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-gray-200 text-sm font-medium">Google Connected</span>
                  </div>
                  <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">Linked</span>
                </div>
              ) : (
                <button 
                  onClick={handleLinkGoogle}
                  disabled={linking}
                  className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span className="text-gray-200 text-sm font-medium">{linking ? 'Linking...' : 'Link Google Account'}</span>
                </button>
              )}
              
              {profileData?.providers?.includes('phone') && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <span className="text-gray-200 text-sm font-medium">Phone Connected</span>
                  </div>
                  <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">Linked</span>
                </div>
              )}
            </div>
          </div>

          {/* Settings / Preferences */}
          <div className="glass-panel rounded-2xl p-5 md:p-6 relative overflow-hidden w-full">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">⚙️</span> Settings & Preferences</h3>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
                  <span className="text-gray-200 text-sm font-medium">App Theme</span>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-primary border-primary text-white hover:bg-primary-light"
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Form */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl p-5 md:p-8 w-full">
            <h3 className="text-white font-bold text-2xl mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">✏️</span>
              Edit Information
            </h3>
            <form onSubmit={handleSave} className="space-y-6">

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name <span className="text-red-400">*</span></label>
                  <input
                    type="text" value={form.name} required
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={form.email} disabled className="input-glass w-full opacity-60 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Short Bio</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us a bit about yourself..."
                  className="input-glass w-full resize-none h-28"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">College / University</label>
                  <input
                    type="text" value={form.college}
                    onChange={e => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. IIT Bombay"
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Branch</label>
                  <input
                    type="text" value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Year of Study</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(y => (
                    <button
                      key={y} type="button"
                      onClick={() => setForm({ ...form, year: y })}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                        form.year === y || form.year === String(y)
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-primary/40 hover:text-white'
                      }`}
                    >
                      Year {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desired Roles Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Desired Roles <span className="text-gray-500 font-normal normal-case">({desiredRoles.length} selected)</span>
                </label>

                {/* Selected roles */}
                {desiredRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {desiredRoles.map(role => (
                      <span key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary text-primary rounded-lg text-xs font-bold">
                        {role}
                        <button type="button" onClick={() => setDesiredRoles(prev => prev.filter(r => r !== role))} className="hover:text-red-400 transition-colors">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick-select pills */}
                <div className="flex flex-wrap gap-2 mb-3 max-h-36 overflow-y-auto pr-1">
                  {ALL_DESIRED_ROLES.filter(r => !desiredRoles.includes(r)).map(role => (
                    <button
                      key={role} type="button"
                      onClick={() => setDesiredRoles(prev => [...prev, role])}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 bg-white/5 border-white/10 text-gray-400 hover:border-primary/40 hover:text-white"
                    >
                      + {role}
                    </button>
                  ))}
                </div>

                {/* Custom role input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = customRole.trim();
                        if (trimmed && !desiredRoles.includes(trimmed)) {
                          setDesiredRoles(prev => [...prev, trimmed]);
                          setCustomRole('');
                        }
                      }
                    }}
                    placeholder="Add custom role..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customRole.trim();
                      if (trimmed && !desiredRoles.includes(trimmed)) {
                        setDesiredRoles(prev => [...prev, trimmed]);
                        setCustomRole('');
                      }
                    }}
                    disabled={!customRole.trim()}
                    className="px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Achievements Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Achievements <span className="text-gray-500 font-normal normal-case">({achievements.length} selected)</span>
                </label>

                {/* Selected achievements */}
                {achievements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {achievements.map(achievement => (
                      <span key={achievement} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg text-xs font-bold">
                        🏅 {achievement}
                        <button type="button" onClick={() => setAchievements(prev => prev.filter(a => a !== achievement))} className="hover:text-red-400 transition-colors ml-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick-select pills */}
                <div className="flex flex-wrap gap-2 mb-3 max-h-36 overflow-y-auto pr-1">
                  {['SIH Participant','SIH Finalist','Hackathon Winner','Hackathon Participant','Research Publication','Patent Filed','Internship Experience','Campus Ambassador','Certification Holder','Open Source Contributor','Startup Founder','Event Organizer','Technical Speaker','Top Performer','Community Lead']
                    .filter(a => !achievements.includes(a))
                    .map(achievement => (
                      <button
                        key={achievement} type="button"
                        onClick={() => setAchievements(prev => [...prev, achievement])}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 bg-white/5 border-white/10 text-gray-400 hover:border-yellow-500/40 hover:text-yellow-300"
                      >
                        + {achievement}
                      </button>
                    ))}
                </div>

                {/* Custom achievement input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAchievement}
                    onChange={e => setCustomAchievement(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = customAchievement.trim();
                        if (trimmed && !achievements.includes(trimmed)) {
                          setAchievements(prev => [...prev, trimmed]);
                          setCustomAchievement('');
                        }
                      }
                    }}
                    placeholder="Add custom achievement..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customAchievement.trim();
                      if (trimmed && !achievements.includes(trimmed)) {
                        setAchievements(prev => [...prev, trimmed]);
                        setCustomAchievement('');
                      }
                    }}
                    disabled={!customAchievement.trim()}
                    className="px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-xl text-sm font-bold hover:bg-yellow-500/20 transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Seeking Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Seeking <span className="text-gray-500 font-normal normal-case">({seeking.length} selected)</span>
                </label>

                {/* Selected seeking items */}
                {seeking.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {seeking.map(item => (
                      <span key={item} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold">
                        🤝 {item}
                        <button type="button" onClick={() => setSeeking(prev => prev.filter(s => s !== item))} className="hover:text-red-400 transition-colors ml-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick-select pills */}
                <div className="flex flex-wrap gap-2 mb-3 max-h-36 overflow-y-auto pr-1">
                  {['Hackathon Teammates','Project Collaborators','Startup Co-founders','Research Partners','Study Buddies','Open Source Contributors','Mentors','Internship Partners','Designers','Developers','AI Enthusiasts','Content Creators','Community Builders']
                    .filter(s => !seeking.includes(s))
                    .map(item => (
                      <button
                        key={item} type="button"
                        onClick={() => setSeeking(prev => [...prev, item])}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 bg-white/5 border-white/10 text-gray-400 hover:border-emerald-500/40 hover:text-emerald-300"
                      >
                        + {item}
                      </button>
                    ))}
                </div>

                {/* Custom seeking input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSeeking}
                    onChange={e => setCustomSeeking(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = customSeeking.trim();
                        if (trimmed && !seeking.includes(trimmed)) {
                          setSeeking(prev => [...prev, trimmed]);
                          setCustomSeeking('');
                        }
                      }
                    }}
                    placeholder="Add custom seeking..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customSeeking.trim();
                      if (trimmed && !seeking.includes(trimmed)) {
                        setSeeking(prev => [...prev, trimmed]);
                        setCustomSeeking('');
                      }
                    }}
                    disabled={!customSeeking.trim()}
                    className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Dynamic Skill Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Skills <span className="text-gray-500 font-normal normal-case">({skills.length} selected)</span>
                </label>

                {/* Selected Skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map(skill => (
                      <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary text-primary rounded-lg text-xs font-bold">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick-select chips */}
                <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto pr-1">
                  {ALL_SKILLS.filter(s => !skills.includes(s)).map(skill => (
                    <button
                      key={skill} type="button"
                      onClick={() => toggleSkill(skill)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 bg-white/5 border-white/10 text-gray-400 hover:border-primary/40 hover:text-white"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>

                {/* Custom skill input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={e => setCustomSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                    placeholder="Add custom skill..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    disabled={!customSkill.trim()}
                    className="px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 space-y-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-[1px] w-1/3 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <h4 className="text-white font-bold text-lg">App Settings</h4>
                
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h5 className="text-white font-bold text-sm">Application Theme</h5>
                    <p className="text-gray-400 text-xs mt-1">Choose your preferred appearance</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${theme === 'light' ? 'bg-primary' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white flex items-center justify-center transition-transform duration-300 ${theme === 'light' ? 'translate-x-8' : 'translate-x-0'}`}>
                      {theme === 'light' ? '☀️' : '🌙'}
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 space-y-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-[1px] w-1/3 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <h4 className="text-white font-bold text-lg">External Links</h4>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Resume URL (Google Drive / Dropbox)</label>
                  <input type="url" value={form.resume_url} onChange={e => setForm({ ...form, resume_url: e.target.value })} placeholder="https://..." className="input-glass w-full" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Profile Picture URL (e.g. Imgur, GitHub)</label>
                  <input type="url" value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." className="input-glass w-full" />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">GitHub URL</label>
                    <input type="url" value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." className="input-glass w-full" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">LinkedIn URL</label>
                    <input type="url" value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className="input-glass w-full" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-8 border-t border-white/5">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;