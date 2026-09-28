import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Target,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Globe,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Award
} from 'lucide-react';

const GithubIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const LinkedinIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    state: '',
    country: 'India',
    bio: '',
    college: '',
    degree: '',
    branch: '',
    year: '',
    graduation_year: '',
    career_goal: '',
    desired_role: '',
    skills: [],
    domain_interests: [],
    experience_level: '',
    resume_url: '',
    portfolio_url: '',
    github_url: '',
    linkedin_url: '',
    open_to_work: true,
    available_for_internship: true,
    full_time: true
  });

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await profileApi.get();
      const data = res?.data || res || {};
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'India',
        bio: data.bio || '',
        college: data.college || '',
        degree: data.degree || '',
        branch: data.branch || '',
        year: data.year ? String(data.year) : '',
        graduation_year: data.graduation_year ? String(data.graduation_year) : '',
        career_goal: data.career_goal || data.desired_role || '',
        desired_role: data.desired_role || data.career_goal || '',
        skills: Array.isArray(data.skills)
          ? data.skills.map(s => (typeof s === 'string' ? s : s.name || ''))
          : [],
        domain_interests: Array.isArray(data.domain_interests)
          ? data.domain_interests
          : Array.isArray(data.interests)
          ? data.interests
          : [],
        experience_level: data.experience_level || '',
        resume_url: data.resume_url || '',
        portfolio_url: data.portfolio_url || '',
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        open_to_work: data.open_to_work ?? true,
        available_for_internship: data.available_for_internship ?? true,
        full_time: data.full_time ?? true
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err?.response?.data?.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleAddInterest = (e) => {
    if (e) e.preventDefault();
    const trimmed = newInterest.trim();
    if (trimmed && !formData.domain_interests.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        domain_interests: [...prev.domain_interests, trimmed]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData(prev => ({
      ...prev,
      domain_interests: prev.domain_interests.filter(i => i !== interestToRemove)
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year, 10) : null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null
      };

      await profileApi.update(payload);
      setSuccessMessage('Profile saved successfully!');
      setIsEditing(false);
      await fetchProfile();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err?.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'India',
        bio: profile.bio || '',
        college: profile.college || '',
        degree: profile.degree || '',
        branch: profile.branch || '',
        year: profile.year ? String(profile.year) : '',
        graduation_year: profile.graduation_year ? String(profile.graduation_year) : '',
        career_goal: profile.career_goal || profile.desired_role || '',
        desired_role: profile.desired_role || profile.career_goal || '',
        skills: Array.isArray(profile.skills)
          ? profile.skills.map(s => (typeof s === 'string' ? s : s.name || ''))
          : [],
        domain_interests: Array.isArray(profile.domain_interests)
          ? profile.domain_interests
          : Array.isArray(profile.interests)
          ? profile.interests
          : [],
        experience_level: profile.experience_level || '',
        resume_url: profile.resume_url || '',
        portfolio_url: profile.portfolio_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        open_to_work: profile.open_to_work ?? true,
        available_for_internship: profile.available_for_internship ?? true,
        full_time: profile.full_time ?? true
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const completionScore = profile?.profile_completion ?? 0;
  const displayName = formData.name || profile?.name || user?.name || user?.email || 'Student';
  const displayEmail = profile?.email || user?.email || '';

  return (
    <div className="w-full space-y-6 font-sans pb-16">
      {/* ── Top Notification Alerts ── */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchProfile}
            className="ml-auto text-xs font-bold text-red-700 underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Hero Profile Card ── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2015ff] to-blue-500 text-2xl font-black text-white shadow-md sm:h-24 sm:w-24 sm:text-3xl">
              {profile?.profile_photo || profile?.avatar_url ? (
                <img
                  src={profile.profile_photo || profile.avatar_url}
                  alt={displayName}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {displayName}
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2015ff] border border-blue-100">
                  Student
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <Mail size={14} className="text-slate-400" />
                {displayEmail}
              </p>
              {(formData.city || formData.state) && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <MapPin size={13} className="text-slate-400" />
                  {[formData.city, formData.state, formData.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={15} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2015ff] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2015ff] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Edit3 size={15} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Award size={14} className="text-[#2015ff]" />
              Profile Strength
            </span>
            <span className="font-extrabold text-[#2015ff]">{completionScore}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2015ff] to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(completionScore, 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Main Details Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols on lg) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Academic Background */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <GraduationCap size={20} className="text-[#2015ff]" />
              <h2 className="text-lg font-bold text-slate-900">Education & Academics</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  College / University
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => handleInputChange('college', e.target.value)}
                    placeholder="e.g. IIT Bombay"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.college || <span className="text-slate-400 italic">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Degree
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => handleInputChange('degree', e.target.value)}
                    placeholder="e.g. B.Tech / B.E."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.degree || <span className="text-slate-400 italic">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Branch / Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.branch || <span className="text-slate-400 italic">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Graduation Year
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.graduation_year || formData.year}
                    onChange={(e) => {
                      handleInputChange('graduation_year', e.target.value);
                      handleInputChange('year', e.target.value);
                    }}
                    placeholder="e.g. 2026"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.graduation_year || formData.year || <span className="text-slate-400 italic">Not specified</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Career Goals & Ambition */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Target size={20} className="text-[#2015ff]" />
              <h2 className="text-lg font-bold text-slate-900">Career Goals & Desired Role</h2>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Target Career Role
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.career_goal}
                    onChange={(e) => {
                      handleInputChange('career_goal', e.target.value);
                      handleInputChange('desired_role', e.target.value);
                    }}
                    placeholder="e.g. Full Stack Developer, AI/ML Engineer, SDE-1"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formData.career_goal || <span className="text-slate-400 italic">Not set yet</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Bio / Summary
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell recruiters about your passions, strengths, and what drives you..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {formData.bio || <span className="text-slate-400 italic">No bio provided.</span>}
                  </p>
                )}
              </div>

              {/* Work availability chips */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Work Availability
                </label>
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleInputChange('open_to_work', !formData.open_to_work)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition ${
                          formData.open_to_work
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {formData.open_to_work ? '✓ Open to Work' : '+ Open to Work'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('available_for_internship', !formData.available_for_internship)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition ${
                          formData.available_for_internship
                            ? 'bg-blue-50 text-[#2015ff] border-blue-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {formData.available_for_internship ? '✓ Internship' : '+ Internship'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('full_time', !formData.full_time)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition ${
                          formData.full_time
                            ? 'bg-purple-50 text-purple-700 border-purple-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {formData.full_time ? '✓ Full Time' : '+ Full Time'}
                      </button>
                    </>
                  ) : (
                    <>
                      {formData.open_to_work && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                          ✓ Open to Work
                        </span>
                      )}
                      {formData.available_for_internship && (
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#2015ff]">
                          ✓ Internship
                        </span>
                      )}
                      {formData.full_time && (
                        <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700">
                          ✓ Full Time
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Skills & Domain Interests */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Sparkles size={20} className="text-[#2015ff]" />
              <h2 className="text-lg font-bold text-slate-900">Technical Skills & Domains</h2>
            </div>

            <div className="mt-5 space-y-6">
              {/* Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Skills ({formData.skills.length})
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50/80 border border-blue-100 px-3 py-1 text-xs font-bold text-[#2015ff]"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-blue-400 hover:text-red-500"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                  {formData.skills.length === 0 && !isEditing && (
                    <p className="text-xs text-slate-400 italic">No skills added yet.</p>
                  )}
                </div>

                {isEditing && (
                  <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add skill (e.g. React, Python)"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-xl bg-[#2015ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </form>
                )}
              </div>

              {/* Domain Interests */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Domain Interests ({formData.domain_interests.length})
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.domain_interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200/80 px-3 py-1 text-xs font-bold text-slate-700"
                    >
                      {interest}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                  {formData.domain_interests.length === 0 && !isEditing && (
                    <p className="text-xs text-slate-400 italic">No domain interests specified.</p>
                  )}
                </div>

                {isEditing && (
                  <form onSubmit={handleAddInterest} className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add interest (e.g. FinTech, Web3)"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-black"
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Social Links */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Phone size={18} className="text-[#2015ff]" />
              <h2 className="text-base font-bold text-slate-900">Personal & Contact</h2>
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : (
                  <p className="font-semibold text-slate-800">{formData.name || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : (
                  <p className="font-semibold text-slate-800">{formData.phone || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : (
                  <p className="font-semibold text-slate-800">{formData.city || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : (
                  <p className="font-semibold text-slate-800">{formData.state || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Country
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : (
                  <p className="font-semibold text-slate-800">{formData.country || 'India'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Social Profiles & Portfolio Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <LinkIcon size={18} className="text-[#2015ff]" />
              <h2 className="text-base font-bold text-slate-900">Links & Showcase</h2>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <FileText size={13} className="text-slate-400" />
                  Resume URL
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.resume_url}
                    onChange={(e) => handleInputChange('resume_url', e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : formData.resume_url ? (
                  <a
                    href={formData.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs font-bold text-[#2015ff] hover:underline"
                  >
                    View Resume ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-1">Not linked</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Globe size={13} className="text-slate-400" />
                  Portfolio Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                    placeholder="https://myportfolio.dev"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : formData.portfolio_url ? (
                  <a
                    href={formData.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs font-bold text-[#2015ff] hover:underline"
                  >
                    {formData.portfolio_url} ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-1">Not linked</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <GithubIcon size={13} className="text-slate-400" />
                  GitHub Profile
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => handleInputChange('github_url', e.target.value)}
                    placeholder="https://github.com/username"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : formData.github_url ? (
                  <a
                    href={formData.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs font-bold text-[#2015ff] hover:underline"
                  >
                    {formData.github_url} ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-1">Not linked</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <LinkedinIcon size={13} className="text-slate-400" />
                  LinkedIn Profile
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-[#2015ff] focus:outline-none"
                  />
                ) : formData.linkedin_url ? (
                  <a
                    href={formData.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs font-bold text-[#2015ff] hover:underline"
                  >
                    {formData.linkedin_url} ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-1">Not linked</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
