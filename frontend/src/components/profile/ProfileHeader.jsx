import React from 'react';
import { Camera, MapPin, Mail, Phone, Globe, Edit3, CheckCircle2 } from 'lucide-react';

const ProfileHeader = ({ form, desiredRoles, completionPct, onAvatarSelected, setEditingSection }) => {
  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
      
      {/* Background Graphic matching the reference */}
      <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-50 flex items-center justify-end overflow-hidden">
        <div className="w-96 h-96 bg-gradient-to-l from-indigo-50/50 to-transparent rounded-full translate-x-1/3 -translate-y-1/4" />
      </div>

      <div className="relative group shrink-0">
        <label htmlFor="avatar-upload" className="cursor-pointer block relative z-10">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex items-center justify-center transition-all group-hover:shadow-2xl">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <span className="text-4xl font-black text-gray-400">
                {form.name ? form.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
        </label>
        <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={onAvatarSelected} />
        
        <button className="absolute bottom-1 right-1 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-indigo-600 transition-colors z-20" onClick={() => setEditingSection('personal')}>
           <Edit3 size={18} />
        </button>
      </div>

      <div className="flex-1 text-center md:text-left relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-2">
            {form.name || 'Your Name'}
            {completionPct === 100 && (
              <CheckCircle2 className="text-blue-500 fill-blue-50 w-6 h-6" title="Verified Profile" />
            )}
          </h1>
          <button 
            onClick={() => setEditingSection('personal')}
            className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        </div>

        <p className="text-gray-600 font-medium text-base mb-4">
          {desiredRoles.length > 0 ? desiredRoles[0] : 'Aspiring Professional'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500 font-medium mb-6">
          <div 
            className="flex items-center gap-2 justify-center md:justify-start cursor-pointer group/item hover:text-indigo-600 transition-colors" 
            onClick={() => setEditingSection('personal')}
            title="Click to edit location"
          >
            <MapPin size={16} className="text-gray-400 group-hover/item:text-indigo-600 transition-colors" />
            <span>{[form.city, form.state, form.country].filter(Boolean).join(', ') || 'Add Location'}</span>
          </div>
          <div 
            className="flex items-center gap-2 justify-center md:justify-start cursor-pointer group/item hover:text-indigo-600 transition-colors" 
            onClick={() => setEditingSection('personal')}
            title="Click to edit phone"
          >
            <Phone size={16} className="text-gray-400 group-hover/item:text-indigo-600 transition-colors" />
            <span>{form.phone || 'Add Phone'}</span>
          </div>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Mail size={16} className="text-gray-400" />
            <span>{form.email || 'Add Email'}</span>
          </div>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Globe size={16} className="text-gray-400" />
            {form.linkedin_url ? (
              <a href={form.linkedin_url.startsWith('http') ? form.linkedin_url : `https://${form.linkedin_url}`} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors line-clamp-1">
                {form.linkedin_url.replace(/(^\w+:|^)\/\//, '')}
              </a>
            ) : (
              <button onClick={() => setEditingSection('personal')} className="hover:text-indigo-600 transition-colors">
                Add LinkedIn
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">Open to Work</span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">Available for Internship</span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">Full-time</span>
        </div>
      </div>
      
      <button 
        onClick={() => setEditingSection('personal')}
        className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all shadow-sm mt-4"
      >
        <Edit3 size={16} /> Edit Profile
      </button>
    </div>
  );
};

export default ProfileHeader;
