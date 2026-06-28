import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.put('/admin/settings', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Platform Settings</h2>
          <p className="text-gray-400 mt-1">Configure global application behaviors and themes.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#2015FF] hover:bg-blue-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#2015FF]/20"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-2xl bg-[#080812] border border-white/5 rounded-3xl p-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium rounded-xl">
            Settings updated successfully!
          </div>
        )}

        <div className="space-y-8">
          
          {/* General Config */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">General Configuration</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div>
                  <h4 className="text-white font-bold">Maintenance Mode</h4>
                  <p className="text-sm text-gray-400">Put the platform in maintenance mode (admins can still log in).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="maintenance_mode" checked={settings?.maintenance_mode || false} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2015FF]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div>
                  <h4 className="text-white font-bold">Allow New Registrations</h4>
                  <p className="text-sm text-gray-400">Allow new users to sign up.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="allow_registrations" checked={settings?.allow_registrations || false} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2015FF]"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Variables */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Variables</h3>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Support Contact Email</label>
                <input 
                  type="email" 
                  name="contact_email"
                  value={settings?.contact_email || ''} 
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2015FF] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Default Theme</label>
                <select 
                  name="default_theme"
                  value={settings?.default_theme || 'dark'}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2015FF] transition-colors"
                >
                  <option value="dark" className="bg-[#0f0f1a]">Dark Mode</option>
                  <option value="light" className="bg-[#0f0f1a]">Light Mode</option>
                </select>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
