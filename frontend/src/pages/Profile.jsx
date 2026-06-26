import { useEffect, useState } from 'react';
import api from '../api/axios';

const Profile = () => {
  const [form, setForm] = useState({
    name: '', email: '', college: '', branch: '', year: '', skills: '',
    bio: '', resume_url: '', github_url: '', linkedin_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    api.get('/students/profile').then(res => {
      const d = res.data;
      setProfileCompletion(d.profile_completion || 0);
      setForm({
        name: d.name || '',
        email: d.email || '',
        college: d.college || '',
        branch: d.branch || '',
        year: d.year || '',
        skills: Array.isArray(d.skills) ? d.skills.join(', ') : '',
        bio: d.bio || '',
        resume_url: d.resume_url || '',
        github_url: d.github_url || '',
        linkedin_url: d.linkedin_url || ''
      });
    }).catch(console.error).finally(() => setLoading(false));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await api.put('/students/profile', { ...form, skills: skillsArray });
      showToast('Profile updated successfully!', 'success');
      fetchProfile(); // Refetch to get updated completion %
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl glass-panel animate-[fade-in-down_0.3s_ease-out] ${
          toast.type === 'success'
            ? 'border-green-500/30 text-green-400 bg-green-500/5'
            : 'border-red-500/30 text-red-400 bg-red-500/5'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
          <span className="text-4xl">👤</span> <span className="text-gradient">My Profile</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Keep your profile updated to increase your chances of selection.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            
            <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(32,21,255,0.2)] backdrop-blur-md relative z-10">
              <span className="text-4xl font-bold text-primary">
                {form.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-white font-bold text-2xl tracking-tight relative z-10">{form.name}</h2>
            <p className="text-gray-400 text-sm mt-1 relative z-10">{form.email}</p>
            {form.college && <p className="text-primary text-xs font-bold mt-3 bg-primary/10 border border-primary/20 inline-block px-4 py-1.5 rounded-full relative z-10">{form.college}</p>}

            <div className="mt-8 glass-card border-transparent p-5 relative z-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Profile Strength</span>
                <span className="text-xl text-primary font-black">{profileCompletion}%</span>
              </div>
              <div className="h-2.5 bg-black/50 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(32,21,255,0.5)]"
                  style={{ width: `${profileCompletion}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                </div>
              </div>
            </div>
          </div>

          {form.skills && (
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
              <h3 className="text-white font-bold mb-5 flex items-center gap-2 relative z-10"><span className="text-xl">⚡</span> Skills</h3>
              <div className="flex flex-wrap gap-2.5 relative z-10">
                {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                  <span key={skill} className="px-3.5 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/10 transition-colors">
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
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm shadow-[0_0_10px_rgba(32,21,255,0.2)]">✏️</span>
              Edit Information
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="input-glass w-full opacity-60 cursor-not-allowed"
                  />
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
                    type="text"
                    value={form.college}
                    onChange={e => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. IIT Bombay"
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Branch</label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Year of Study</label>
                  <select
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    className="input-glass w-full [&>option]:bg-[#111]"
                  >
                    <option value="">Select year</option>
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={e => setForm({ ...form, skills: e.target.value })}
                    placeholder="React, Node.js, Python"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 space-y-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-[1px] w-1/3 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <h4 className="text-white font-bold text-lg">External Links</h4>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Resume URL (Google Drive / DropBox)</label>
                  <input
                    type="url"
                    value={form.resume_url}
                    onChange={e => setForm({ ...form, resume_url: e.target.value })}
                    placeholder="https://..."
                    className="input-glass w-full"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">GitHub URL</label>
                    <input
                      type="url"
                      value={form.github_url}
                      onChange={e => setForm({ ...form, github_url: e.target.value })}
                      placeholder="https://github.com/..."
                      className="input-glass w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">LinkedIn URL</label>
                    <input
                      type="url"
                      value={form.linkedin_url}
                      onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="input-glass w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-8 border-t border-white/5">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
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