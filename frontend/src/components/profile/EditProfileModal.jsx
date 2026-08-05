import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Phone, Globe, Briefcase, GraduationCap, Link as LinkIcon, Check } from 'lucide-react';

const EditProfileModal = ({ isOpen, onClose, form, setForm, desiredRoles, setDesiredRoles, onSave, saving }) => {
  const [localRole, setLocalRole] = useState(desiredRoles[0] || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLocalRole(desiredRoles[0] || '');
  }, [desiredRoles]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 3) {
      errs.name = 'Full name must be at least 3 characters.';
    }
    if (form.phone && form.phone.trim().length > 0) {
      // Flexible validation supporting +91 and international formats
      const cleanPhone = form.phone.replace(/[\s\-\(\)\+]/g, '');
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        errs.phone = 'Please enter a valid phone number (7-15 digits).';
      }
    }
    if (form.linkedin_url && form.linkedin_url.trim().length > 0) {
      if (!form.linkedin_url.toLowerCase().includes('linkedin.com')) {
        errs.linkedin_url = 'Please enter a valid LinkedIn URL (e.g. linkedin.com/in/username).';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Update desired roles array
    if (localRole.trim()) {
      setDesiredRoles([localRole.trim()]);
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Edit Personal Profile</h3>
              <p className="text-gray-500 text-xs">Update your personal details, contact info, and availability.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
              <User size={14} className="text-indigo-500" /> Basic Information
            </h4>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-all ${errors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-indigo-500'}`}
                  placeholder="e.g. Ratikant Patil"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Desired Role / Title</label>
                <input 
                  type="text" 
                  value={localRole} 
                  onChange={e => setLocalRole(e.target.value)} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. Frontend Developer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bio / Professional Summary</label>
              <textarea 
                value={form.bio} 
                onChange={e => setForm({ ...form, bio: e.target.value })} 
                rows={3} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none"
                placeholder="Share a short bio about your passions, tech stack, and goals..."
              />
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-500" /> Contact & Location
            </h4>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-all ${errors.phone ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-indigo-500'}`}
                    placeholder="+91 9876543210"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City / Location</label>
                <input 
                  type="text" 
                  value={form.city} 
                  onChange={e => setForm({ ...form, city: e.target.value })} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. Pune"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                <input 
                  type="text" 
                  value={form.state} 
                  onChange={e => setForm({ ...form, state: e.target.value })} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Country</label>
                <input 
                  type="text" 
                  value={form.country} 
                  onChange={e => setForm({ ...form, country: e.target.value })} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. India"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social & Web Links */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-500" /> Professional Links
            </h4>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">LinkedIn URL</label>
                <input 
                  type="text" 
                  value={form.linkedin_url} 
                  onChange={e => setForm({ ...form, linkedin_url: e.target.value })} 
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-all ${errors.linkedin_url ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-indigo-500'}`}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                {errors.linkedin_url && <p className="text-red-500 text-xs mt-1">{errors.linkedin_url}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">GitHub URL</label>
                <input 
                  type="text" 
                  value={form.github_url} 
                  onChange={e => setForm({ ...form, github_url: e.target.value })} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="https://github.com/yourusername"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Education Quick Details */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-indigo-500" /> Education
            </h4>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">College / University</label>
                <input 
                  type="text" 
                  value={form.college} 
                  onChange={e => setForm({ ...form, college: e.target.value })} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. COEP Technological University"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Year</label>
                <select 
                  value={form.year} 
                  onChange={e => setForm({ ...form, year: e.target.value })} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all bg-white"
                >
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

          {/* Footer Action Buttons */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default EditProfileModal;
