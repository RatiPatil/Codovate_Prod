import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Briefcase, MapPin, Save, Lock } from 'lucide-react';
import { showAlert } from '../../utils/uiUtils';

const MentorProfile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    designation: '',
    company: '',
    experience: '',
    bio: '',
    specialization: '',
    availability: '',
    linkedin: '',
    github: '',
    portfolio: ''
  });
  
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // In a real app we'd have a specific GET /mentor-profile
      // Since mentor is stored in mentors collection, we can just GET /mentors/me or just use user info if it's there
      // Wait, we don't have a /mentors/me endpoint. I'll mock it or just rely on what we can. 
      // Actually, I can use the admin endpoint if I expose a mentor-specific one.
      const res = await api.get('/mentor-auth/me'); // I should build this
      if(res.data) setFormData({ ...formData, ...res.data });
    } catch (err) {
      console.error(err);
      // Fallback
      if (user) {
        setFormData({ ...formData, name: user.name, email: user.email });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/mentor-auth/profile', formData); // Needs backend implementation
      showAlert("Profile updated successfully");
      // update context if name changed
      login({ ...user, name: formData.name }, localStorage.getItem('token'));
    } catch (err) {
      showAlert("Failed to update profile");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      return showAlert("New passwords do not match.");
    }
    if (passwords.new_password.length < 6) {
      return showAlert("Password must be at least 6 characters.");
    }
    try {
      await api.post('/mentor-auth/change-password', passwords);
      showAlert("Password changed successfully");
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
      <p className="text-gray-400 mb-8">Manage your personal information and security settings.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleProfileUpdate} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-400" /> Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input type="email" disabled value={formData.email} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Mobile</label>
                <input type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Experience (Years)</label>
                <input type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
                <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Designation</label>
                <input type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
              <textarea rows="4" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Security / Password */}
        <div>
          <form onSubmit={handlePasswordUpdate} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock size={20} className="text-emerald-400" /> Security
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                <input type="password" required value={passwords.current_password} onChange={e => setPasswords({...passwords, current_password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input type="password" required value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                <input type="password" required value={passwords.confirm_password} onChange={e => setPasswords({...passwords, confirm_password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
/ /   E O F  
 