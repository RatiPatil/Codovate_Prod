import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const ALL_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'TypeScript',
  'Flutter', 'Kotlin', 'Swift', 'Machine Learning', 'TensorFlow',
  'Figma', 'Photoshop', 'Linux', 'GraphQL', 'Next.js', 'Django', 'Vue.js',
];

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', college: '', branch: '', year: '',
    bio: '', resume_url: '', github_url: '', linkedin_url: ''
  });
  const [skills, setSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

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
        linkedin_url: d.linkedin_url || ''
      });
      setSkills(Array.isArray(d.skills) ? d.skills : []);
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
      await api.put('/students/profile', { ...form, skills });
      showToast('Profile updated successfully! ✅', 'success');
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">
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
          <div className="glass-panel rounded-2xl p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />
            <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(32,21,255,0.2)] backdrop-blur-md relative z-10">
              <span className="text-4xl font-bold text-primary">{form.name.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-white font-bold text-2xl tracking-tight relative z-10">{form.name}</h2>
            <p className="text-gray-400 text-sm mt-1 relative z-10">{form.email}</p>
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
            <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Activity Score</p>
              <p className="text-3xl font-black text-white">{profileData?.activity_score || 0}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Points</p>
              <p className="text-3xl font-black text-primary">{profileData?.points || 0}</p>
            </div>
          </div>

          {/* Badges Section */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-[100px] pointer-events-none" />
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10"><span className="text-xl">🏅</span> Achievements</h3>
            {(!profileData?.badges || profileData.badges.length === 0) ? (
              <div className="text-center py-6 glass-card border-dashed">
                <p className="text-gray-400 text-xs">No badges earned yet. Participate in hackathons to earn badges!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 relative z-10">
                {profileData.badges.map(badge => (
                  <div key={badge} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl">
                    <span className="text-sm">🏆</span>
                    <span className="text-xs font-bold text-yellow-400">{badge}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
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
        </div>

        {/* Right Form */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl p-6 md:p-8">
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
                <h4 className="text-white font-bold text-lg">External Links</h4>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Resume URL (Google Drive / Dropbox)</label>
                  <input type="url" value={form.resume_url} onChange={e => setForm({ ...form, resume_url: e.target.value })} placeholder="https://..." className="input-glass w-full" />
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