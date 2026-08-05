import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MilestoneModal from '../components/MilestoneModal';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import { uploadProfilePhoto, uploadResume } from '../utils/storageUtils';
import SkeletonLoader from '../components/common/SkeletonLoader';
import confetti from 'canvas-confetti';

// Import new components
import ProfileHeader from '../components/profile/ProfileHeader';
import RightSidebar from '../components/profile/RightSidebar';
import TabNav from '../components/profile/TabNav';
import { 
  AboutTab, 
  SkillsTab, 
  ExperienceTab, 
  ProjectsTab, 
  EducationTab, 
  CertificatesTab, 
  AchievementsTab 
} from '../components/profile/ProfileTabsContent';

const Profile = () => {
  const { user, updateUser } = useAuth();
  
  // State from previous implementation
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ applications: 0, interviews: 0, shortlisted: 0, offers: 0 });
  const [activities, setActivities] = useState([]);
  
  const [editingSection, setEditingSection] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  
  const [form, setForm] = useState({
    name: '', email: '', college: '', branch: '', year: '', bio: '', 
    github_url: '', linkedin_url: '', avatar_url: '', resume_url: '', portfolio_url: '',
    phone: '', city: '', state: '', country: ''
  });
  
  const [skills, setSkills] = useState([]);
  const [desiredRoles, setDesiredRoles] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [seeking, setSeeking] = useState([]);
  const [passionateAbout, setPassionateAbout] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });
  
  const [showMilestone, setShowMilestone] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  // Force Light Theme for this page as per requirements
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    return () => {
      // Revert to user preference on unmount
      const storedTheme = localStorage.getItem('theme') || 'dark';
      if (storedTheme === 'dark') {
         document.documentElement.classList.add('dark');
         document.documentElement.classList.remove('light');
      }
    };
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#4F46E5', '#7C3AED', '#06B6D4'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#4F46E5', '#7C3AED', '#06B6D4'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const fetchProfile = useCallback(() => {
    api.get('/students/profile').then(res => {
      const d = res.data;
      setProfileData(d);
      setForm({
        name: d.name || '', email: d.email || '', college: d.college || '', branch: d.branch || '',
        year: d.year || '', bio: d.bio || '', github_url: d.github_url || '', linkedin_url: d.linkedin_url || '',
        avatar_url: d.avatar_url || '', resume_url: d.resume_url || '', portfolio_url: d.portfolio_url || '',
        phone: d.phone || '', city: d.city || '', state: d.state || '', country: d.country || ''
      });
      setSkills(Array.isArray(d.skills) ? d.skills : []);
      setDesiredRoles(Array.isArray(d.desired_roles) ? d.desired_roles : (d.careerGoal ? [d.careerGoal] : []));
      setAchievements(Array.isArray(d.achievements) ? d.achievements : []);
      setSeeking(Array.isArray(d.seeking) ? d.seeking : []);
      setPassionateAbout(Array.isArray(d.passionate_about) ? d.passionate_about : []);
      setProjects(Array.isArray(d.projects) ? d.projects : []);
      setCertificates(Array.isArray(d.certificates) ? d.certificates : []);
      
      if (d.profile_completion === 100 && localStorage.getItem('milestone_100_shown') !== 'true') {
        triggerConfetti();
        setShowMilestone(true);
        localStorage.setItem('milestone_100_shown', 'true');
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fetchActivity = useCallback(() => {
    api.get('/students/activity').then(res => setActivities(res.data || [])).catch(console.error);
    api.get('/students/stats').then(res => setStats(res.data || {})).catch(console.error);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchActivity();
  }, [fetchProfile, fetchActivity]);

  const handleSaveSection = async (sectionKey) => {
    if (sectionKey === 'personal' && (!form.name || form.name.trim().length < 3)) {
      showToast('Full name must be at least 3 characters.', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const payload = { 
        ...form, skills, desired_roles: desiredRoles, achievements, seeking, passionate_about: passionateAbout, projects, certificates
      };
      await api.put('/students/profile', payload);
      if (updateUser) {
        updateUser({
          name: form.name,
          phone: form.phone,
          photoURL: form.avatar_url,
          avatar_url: form.avatar_url
        });
      }
      showToast('Profile updated successfully! ✅', 'success');
      setEditingSection(null);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarSelected = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { showToast('File too large (max 5MB)', 'error'); return; }
      setImageToCrop(URL.createObjectURL(file));
      setShowCropper(true);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob) => {
    try {
      showToast('Uploading profile photo...', 'success');
      const url = await uploadProfilePhoto(croppedBlob, user?.uid || user?.id);
      setForm(prev => ({ ...prev, avatar_url: url }));
      await api.put('/students/profile', { avatar_url: url });
      if (updateUser) {
        updateUser({ photoURL: url, avatar_url: url });
      }
      showToast('Profile photo updated! ✅', 'success');
      fetchProfile();
    } catch (err) {
      console.error("Avatar upload error:", err);
      showToast(err.message || 'Failed to upload photo.', 'error');
    }
  };

  const handleResumeDownload = () => {
    if (form.resume_url) {
      window.open(form.resume_url, '_blank');
    } else {
      showToast('No resume uploaded yet.', 'error');
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.origin + '/public/' + (user?.uid || user?.id));
    showToast('Public profile link copied to clipboard!', 'success');
  };
  
  const completionPct = profileData?.profile_completion || 0;

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto pt-8 px-4 bg-[#f8fafc] min-h-screen">
      <SkeletonLoader type="card" count={3} />
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 bg-[#f8fafc] min-h-screen font-sans text-gray-900">
      
      {/* Toast & Modals */}
      <EditProfileModal 
        isOpen={editingSection === 'personal'} 
        onClose={() => setEditingSection(null)} 
        form={form} 
        setForm={setForm} 
        desiredRoles={desiredRoles} 
        setDesiredRoles={setDesiredRoles} 
        onSave={() => handleSaveSection('personal')} 
        saving={saving} 
      />
      <ImageCropperModal isOpen={showCropper} onClose={() => setShowCropper(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} />
      <MilestoneModal isOpen={showMilestone} onClose={() => setShowMilestone(false)} title="100% Profile Complete" description="You've unlocked the ultimate builder status." />
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-2xl animate-fade-in-up ${toast.type === 'success' ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          
          <ProfileHeader 
            form={form} 
            desiredRoles={desiredRoles}
            completionPct={completionPct}
            onAvatarSelected={onAvatarSelected}
            setEditingSection={setEditingSection}
          />
          
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="p-0 border-t-0">
              {activeTab === 'about' && (
                <AboutTab form={form} setForm={setForm} editingSection={editingSection} setEditingSection={setEditingSection} handleSaveSection={handleSaveSection} saving={saving} />
              )}
              {activeTab === 'skills' && (
                <SkillsTab skills={skills} setSkills={setSkills} editingSection={editingSection} setEditingSection={setEditingSection} handleSaveSection={handleSaveSection} saving={saving} />
              )}
              {activeTab === 'experience' && (
                <ExperienceTab />
              )}
              {activeTab === 'projects' && (
                <ProjectsTab projects={projects} setProjects={setProjects} editingSection={editingSection} setEditingSection={setEditingSection} handleSaveSection={handleSaveSection} saving={saving} />
              )}
              {activeTab === 'education' && (
                <EducationTab form={form} setForm={setForm} editingSection={editingSection} setEditingSection={setEditingSection} handleSaveSection={handleSaveSection} saving={saving} />
              )}
              {activeTab === 'certificates' && (
                <CertificatesTab />
              )}
              {activeTab === 'achievements' && (
                <AchievementsTab />
              )}
            </div>
          </div>
          
        </div>
        
        {/* RIGHT COLUMN: Sidebar Widgets */}
        <div className="lg:col-span-4">
          <RightSidebar 
            completionPct={completionPct}
            stats={stats}
            skills={skills}
            setEditingSection={setEditingSection}
            handleResumeDownload={handleResumeDownload}
            handleShareProfile={handleShareProfile}
          />
        </div>
        
      </div>
    </div>
  );
};

export default Profile;
