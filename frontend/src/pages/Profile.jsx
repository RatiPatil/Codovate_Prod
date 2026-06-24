import { useEffect, useState } from 'react';
import api from '../api/axios';

const Profile = () => {
  const [form, setForm] = useState({
    name: '', email: '', college: '', branch: '', year: '', skills: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  useEffect(() => {
    api.get('/students/profile').then(res => {
      const d = res.data;
      setForm({
        name: d.name || '',
        email: d.email || '',
        college: d.college || '',
        branch: d.branch || '',
        year: d.year || '',
        skills: Array.isArray(d.skills) ? d.skills.join(', ') : '',
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

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
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const profileComplete = [form.college, form.branch, form.year, form.skills].filter(Boolean).length;
  const completionPercent = Math.round((profileComplete / 4) * 100);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm shadow-xl border ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Keep your profile updated</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-primary">
                {form.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-white font-bold text-lg">{form.name}</h2>
            <p className="text-gray-400 text-sm">{form.email}</p>
            {form.college && <p className="text-gray-500 text-xs mt-1">{form.college}</p>}

            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Profile Complete</span>
                <span className="text-primary font-semibold">{completionPercent}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {form.skills && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                  <span key={skill} className="text-xs bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Form */}
        <div className="md:col-span-2">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-5">Edit Information</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">College / University</label>
                <input
                  type="text"
                  value={form.college}
                  onChange={e => setForm({ ...form, college: e.target.value })}
                  placeholder="e.g. IIT Bombay"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Branch</label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Year of Study</label>
                  <select
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  >
                    <option value="">Select year</option>
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  Skills <span className="text-gray-600">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                  placeholder="e.g. React, Node.js, Python"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;