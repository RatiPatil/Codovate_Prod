import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MilestoneModal from '../components/MilestoneModal';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import { uploadProfilePhoto, uploadResume } from '../utils/storageUtils';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { formatDistanceToNow } from 'date-fns';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { 
  Camera, MapPin, Briefcase, GraduationCap, Trophy, Link as LinkIcon, FileText, 
  Globe, Edit3, X, Plus, Star, Target, Check, 
  ChevronDown, ChevronUp, Shield, Bell, User as UserIcon, Zap, Heart, LayoutDashboard, Settings
} from 'lucide-react';

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

const AnimatedCounter = ({ value }) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.5,
      ease: "power3.out",
      onUpdate: () => {
        node.innerHTML = Math.round(obj.val);
      }
    });
  }, [value]);

  return <span ref={nodeRef}>0</span>;
};

const Profile = () => {
  const { user, linkGoogleAccount } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ applications: 0, teams: 0, mentorSessions: 0, rank: '-', points: 0, daysOnPlatform: 1, selected: 0 });
  const [activities, setActivities] = useState([]);
  
  const [editingSection, setEditingSection] = useState(null);
  
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
  const [linking, setLinking] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showMilestone, setShowMilestone] = useState(false);
  
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);

  const [customSkill, setCustomSkill] = useState('');
  
  const containerRef = useRef(null);

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

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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
        github_url: d.github_url || '',
        linkedin_url: d.linkedin_url || '',
        avatar_url: d.avatar_url || '',
        resume_url: d.resume_url || '',
        portfolio_url: d.portfolio_url || '',
        phone: d.phone || '',
        city: d.city || '',
        state: d.state || '',
        country: d.country || ''
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
    api.get('/students/activity')
      .then(res => setActivities(res.data || []))
      .catch(console.error);
    api.get('/students/stats')
      .then(res => setStats(res.data || {}))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchActivity();
  }, [fetchProfile, fetchActivity]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      let ctx = gsap.context(() => {
        gsap.from('.stagger-animate', {
          y: 40,
          opacity: 0,
          filter: 'blur(10px)',
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#4F46E5', '#7C3AED', '#06B6D4']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#4F46E5', '#7C3AED', '#06B6D4']
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleSaveSection = async (sectionKey) => {
    if (sectionKey === 'personal' && (!form.name || form.name.trim().length < 3)) {
      showToast('Full name must be at least 3 characters.', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        skills, 
        desired_roles: desiredRoles, 
        achievements, 
        seeking, 
        passionate_about: passionateAbout,
        projects,
        certificates
      };
      await api.put('/students/profile', payload);
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
      if (file.size > 5 * 1024 * 1024) {
        showToast('File too large (max 5MB)', 'error');
        return;
      }
      const src = URL.createObjectURL(file);
      setImageToCrop(src);
      setShowCropper(true);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob) => {
    try {
      showToast('Uploading profile photo...', 'success');
      const url = await uploadProfilePhoto(croppedBlob, user.uid || user.id);
      setForm(prev => ({ ...prev, avatar_url: url }));
      await api.put('/students/profile', { avatar_url: url });
      showToast('Profile photo updated! ✅', 'success');
      fetchProfile();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload photo.', 'error');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File too large (max 10MB)', 'error');
        return;
      }
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are allowed.', 'error');
        return;
      }
      
      try {
        setUploadingResume(true);
        const url = await uploadResume(file, user.uid || user.id, (prog) => setResumeProgress(prog));
        setForm(prev => ({ ...prev, resume_url: url }));
        await api.put('/students/profile', { resume_url: url });
        showToast('Resume uploaded successfully! ✅', 'success');
        fetchProfile();
      } catch (err) {
        console.error(err);
        showToast('Failed to upload resume.', 'error');
      } finally {
        setUploadingResume(false);
        setResumeProgress(0);
      }
    }
    e.target.value = '';
  };

  const getMissingItems = () => {
    const items = [];
    if (!form.bio) items.push({ label: 'Add a short bio' });
    if (!form.college) items.push({ label: 'Add your college' });
    if (skills.length === 0) items.push({ label: 'Add your top skills' });
    if (!form.resume_url) items.push({ label: 'Upload your Resume' });
    if (projects.length === 0) items.push({ label: 'Add at least one Project' });
    return items;
  };
  
  const completionPct = profileData?.profile_completion || 0;
  const strokeDasharray = 2 * Math.PI * 36;
  const strokeDashoffset = strokeDasharray - (completionPct / 100) * strokeDasharray;

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto pt-8 px-4">
      <SkeletonLoader type="card" count={3} />
    </div>
  );

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto pb-24 px-4 sm:px-6">
      <ImageCropperModal
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
      <MilestoneModal 
        isOpen={showMilestone} 
        onClose={() => setShowMilestone(false)} 
        title="100% Profile Complete"
        description="You've unlocked the ultimate builder status."
      />
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl glass-panel animate-fade-in-up ${
          toast.type === 'success'
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
            : 'border-rose-500/30 text-rose-400 bg-rose-500/5'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* 1. HERO SECTION */}
      <div className="stagger-animate relative glass-panel rounded-[24px] mt-8 mb-8 p-6 sm:p-10 overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 group shrink-0">
          <label htmlFor="hero-avatar-upload" className="cursor-pointer block relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[32px] bg-white/5 border border-white/20 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.2)] overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_50px_rgba(79,70,229,0.4)] rotate-[2deg] group-hover:rotate-0">
              <div className="w-full h-full rounded-[28px] overflow-hidden bg-gray-900 flex items-center justify-center relative">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <span className="text-5xl font-black text-primary">{form.name ? form.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </label>
          <input type="file" id="hero-avatar-upload" accept="image/*" className="hidden" onChange={onAvatarSelected} />
          
          <div className="absolute -bottom-2 -right-2 bg-gray-900 border-2 border-gray-800 rounded-full p-2 flex items-center gap-2 pr-4 shadow-xl">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Online</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left mt-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
            {form.name || 'Set your name'}
            {completionPct === 100 && <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-transparent bg-clip-text text-2xl" title="Premium Profile">✦</span>}
          </h1>
          <p className="text-lg sm:text-xl text-primary font-bold mb-4">{desiredRoles.length > 0 ? desiredRoles[0] : 'Aspiring Builder'}</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 font-medium">
            {form.college && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-gray-500" /> {form.college}</span>}
            {(form.city || form.country) && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-500" /> {[form.city, form.country].filter(Boolean).join(', ')}</span>}
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Lvl {Math.floor((stats.points || 0)/100) + 1}</span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white"><Zap className="w-4 h-4 text-primary fill-primary" /> {stats.points || 0} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: COMPLETION & STATS */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* PROFILE COMPLETION */}
          <div className="stagger-animate glass-panel rounded-[24px] p-6 sm:p-8 flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Profile Completion</h3>
            <div className="relative w-36 h-36 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle 
                  cx="40" cy="40" r="36" fill="transparent" 
                  stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round"
                  style={{ strokeDasharray, strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white"><AnimatedCounter value={completionPct} />%</span>
              </div>
            </div>
            
            {completionPct < 100 ? (
              <div className="w-full space-y-3">
                <p className="text-xs text-gray-500 mb-4 italic">"Your future recruiter is watching 👀"</p>
                {getMissingItems().map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                    <span className="text-sm text-gray-300 font-medium">{item.label}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full group-hover:scale-110 transition-transform">+{item.boost || 10}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="flex justify-center mb-2"><Trophy className="w-8 h-8" /></div>
                <p className="font-bold text-sm">Profile 100% Complete!</p>
                <p className="text-xs mt-1 opacity-80">You are ready for top opportunities.</p>
              </div>
            )}
          </div>

          {/* QUICK STATS */}
          <div className="stagger-animate grid grid-cols-2 gap-4">
            <div className="glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3 text-primary">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-white"><AnimatedCounter value={projects.length} /></p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Projects</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center mb-3 text-secondary">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-white"><AnimatedCounter value={skills.length} /></p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Skills</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3 text-amber-500">
                <Trophy className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-white"><AnimatedCounter value={achievements.length || 0} /></p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Achievements</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3 text-emerald-500">
                <Globe className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-white"><AnimatedCounter value={stats.applications || 0} /></p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Applications</p>
            </div>
          </div>
          
          {/* SETTINGS SHORTCUTS */}
          <div className="stagger-animate glass-panel rounded-2xl overflow-hidden">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest p-5 pb-2">Preferences</h3>
            <div className="divide-y divide-white/5">
              <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-gray-400"><Shield className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-gray-200">Privacy & Security</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-gray-400"><Bell className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-gray-200">Notifications</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-gray-400"><Settings className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-gray-200">Account Settings</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN CONTENT SECTIONS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* ABOUT ME */}
          <div className="stagger-animate glass-panel rounded-[24px] p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              {editingSection === 'bio' ? (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingSection(null); fetchProfile(); }} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
                  <button onClick={() => handleSaveSection('bio')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-light text-white rounded-lg transition">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              ) : (
                <button onClick={() => setEditingSection('bio')} className="p-2 text-gray-500 hover:text-primary bg-white/5 hover:bg-primary/10 rounded-xl transition opacity-0 group-hover:opacity-100"><Edit3 className="w-4 h-4" /></button>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5 text-primary" /> About Me</h2>
            
            {editingSection === 'bio' ? (
              <textarea 
                value={form.bio} 
                onChange={e => setForm({...form, bio: e.target.value})} 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-y min-h-[120px]" 
                placeholder="Tell us your story..."
              />
            ) : (
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-w-3xl">
                {form.bio || <span className="text-gray-500 italic">No bio added yet. Write something awesome about yourself!</span>}
              </p>
            )}
          </div>

          {/* CAREER GOAL CARD */}
          <div className="stagger-animate relative rounded-[24px] overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 max-w-md text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                <Target className="w-3 h-3" /> Career Goal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                Aspiring <br className="hidden md:block"/> <span className="text-amber-300">{desiredRoles[0] || 'Software Engineer'}</span>
              </h2>
              <p className="text-indigo-100 text-sm">Keep building. Your future company is searching for someone exactly like you.</p>
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center transform rotate-12 hover:rotate-0 hover:scale-110 transition-all duration-500 shadow-xl cursor-pointer" onClick={() => setEditingSection('career')}>
                <RocketIcon className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>
            
            {editingSection === 'career' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-20 p-8 flex flex-col justify-center">
                <h3 className="text-white font-bold mb-4">Edit Career Goal</h3>
                <div className="flex gap-2">
                   <select 
                      onChange={e => { if(e.target.value && !desiredRoles.includes(e.target.value)) setDesiredRoles([e.target.value]); e.target.value=''; }} 
                      className="input-glass text-sm flex-1 bg-white/5 border-white/20"
                    >
                      <option value="" className="text-black">Select a role...</option>
                      {ALL_DESIRED_ROLES.map(r => <option key={r} value={r} className="text-black">{r}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 mt-4 justify-end">
                  <button onClick={() => { setEditingSection(null); fetchProfile(); }} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
                  <button onClick={() => handleSaveSection('career')} disabled={saving} className="px-6 py-2 text-xs font-bold bg-white text-black rounded-lg transition">{saving ? 'Saving...' : 'Save Goal'}</button>
                </div>
              </div>
            )}
          </div>

          {/* SKILLS */}
          <div className="stagger-animate glass-panel rounded-[24px] p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              {editingSection === 'skills' ? (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingSection(null); fetchProfile(); }} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
                  <button onClick={() => handleSaveSection('skills')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-light text-white rounded-lg transition">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              ) : (
                <button onClick={() => setEditingSection('skills')} className="p-2 text-gray-500 hover:text-primary bg-white/5 hover:bg-primary/10 rounded-xl transition opacity-0 group-hover:opacity-100"><Edit3 className="w-4 h-4" /></button>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Superpowers (Skills)</h2>
            
            {editingSection === 'skills' ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => {
                    const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
                    return (
                      <div key={idx} className="flex items-center justify-between pl-3 pr-1 py-1 bg-white/10 border border-white/20 rounded-xl">
                        <span className="text-white text-sm font-medium mr-2">{skillName}</span>
                        <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="p-1 text-gray-400 hover:text-rose-400 bg-black/20 rounded-lg transition"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customSkill.trim() && !skills.includes(customSkill.trim())) { setSkills([...skills, customSkill.trim()]); setCustomSkill(''); } } }} placeholder="Add a custom skill..." className="input-glass w-full text-sm bg-black/20" />
                  <button onClick={() => { if (customSkill.trim() && !skills.includes(customSkill.trim())) { setSkills([...skills, customSkill.trim()]); setCustomSkill(''); } }} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition">Add</button>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-3">Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SKILLS.filter(s => !skills.includes(s)).slice(0, 15).map(skill => (
                      <button key={skill} onClick={() => setSkills([...skills, skill])} className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-primary hover:bg-primary/10 text-gray-400 hover:text-primary transition flex items-center gap-1"><Plus className="w-3 h-3" /> {skill}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {skills.map((skill, idx) => {
                      const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
                      return (
                        <div key={idx} className="px-4 py-2 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 hover:border-white/30 rounded-xl text-white text-sm font-semibold shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 cursor-default transition-all duration-300">
                          {skillName}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">"Every superhero starts somewhere ⚡. Add your skills!"</p>
                )}
              </div>
            )}
          </div>

          {/* PROJECTS */}
          <div className="stagger-animate glass-panel rounded-[24px] p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              {editingSection === 'projects' ? (
                <div className="flex gap-2 z-20 relative">
                  <button onClick={() => { setEditingSection(null); fetchProfile(); }} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
                  <button onClick={() => handleSaveSection('projects')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-light text-white rounded-lg transition">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              ) : (
                <button onClick={() => setEditingSection('projects')} className="p-2 text-gray-500 hover:text-primary bg-white/5 hover:bg-primary/10 rounded-xl transition opacity-0 group-hover:opacity-100 z-20 relative"><Edit3 className="w-4 h-4" /></button>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-emerald-400" /> Featured Projects</h2>
            <p className="text-xs text-gray-500 italic mb-6">"Build something cooler than your final year project 😄"</p>
            
            {editingSection === 'projects' ? (
              <div className="space-y-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-5 bg-black/20 border border-white/10 rounded-2xl relative">
                    <button onClick={() => setProjects(projects.filter((_, i) => i !== idx))} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-rose-400 bg-white/5 rounded-lg transition"><X className="w-4 h-4" /></button>
                    <div className="grid gap-4 max-w-lg">
                      <input type="text" value={proj.title} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], title: e.target.value }; setProjects(p); }} placeholder="Project Title" className="input-glass text-sm font-bold bg-transparent" />
                      <textarea value={proj.description} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], description: e.target.value }; setProjects(p); }} placeholder="Description" className="input-glass text-sm h-20 resize-none bg-transparent" />
                      <input type="url" value={proj.link} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], link: e.target.value }; setProjects(p); }} placeholder="https://github.com/..." className="input-glass text-sm bg-transparent" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setProjects([...projects, { title: '', description: '', link: '' }])} className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-gray-400 text-sm font-bold hover:bg-white/5 hover:border-white/40 hover:text-white transition flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add New Project</button>
              </div>
            ) : (
              <div>
                {projects.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="group/card relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-white/20 transition-all duration-500 flex flex-col h-full">
                        <div className="h-32 bg-gradient-to-br from-gray-800 to-black relative overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                          <LayoutDashboard className="w-12 h-12 text-gray-700 group-hover/card:scale-110 group-hover/card:text-gray-500 transition-transform duration-500" />
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h4 className="font-bold text-white text-lg mb-2">{proj.title || 'Untitled Project'}</h4>
                          <p className="text-gray-400 text-sm flex-1 mb-4 line-clamp-3">{proj.description}</p>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors w-full mt-auto">
                              <Globe className="w-3 h-3" /> View Project
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-gray-500">No projects added yet.</div>
                )}
              </div>
            )}
          </div>

          {/* EDUCATION & EXPERIENCE TIMELINE (UI Only) */}
          <div className="stagger-animate glass-panel rounded-[24px] p-6 sm:p-8 relative">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setEditingSection('personal')} className="p-2 text-gray-500 hover:text-primary bg-white/5 hover:bg-primary/10 rounded-xl transition"><Edit3 className="w-4 h-4" /></button>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-400" /> Journey</h2>
            
            {editingSection === 'personal' ? (
              <div className="space-y-4 mb-8 bg-black/20 p-5 rounded-2xl border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Edit Education</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="text" value={form.college} onChange={e => setForm({...form, college: e.target.value})} placeholder="College Name" className="input-glass text-sm bg-transparent" />
                  <input type="text" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} placeholder="Degree / Branch" className="input-glass text-sm bg-transparent" />
                  <select value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="input-glass text-sm bg-transparent">
                    <option value="" className="text-black">Select Year</option>
                    <option value="1" className="text-black">1st Year</option>
                    <option value="2" className="text-black">2nd Year</option>
                    <option value="3" className="text-black">3rd Year</option>
                    <option value="4" className="text-black">4th Year</option>
                    <option value="Graduated" className="text-black">Graduated</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => { setEditingSection(null); fetchProfile(); }} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
                  <button onClick={() => handleSaveSection('personal')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-light text-white rounded-lg transition">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            ) : null}

            <div className="relative pl-8 md:pl-0 space-y-8 before:absolute before:inset-0 before:ml-10 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-white/10 before:to-transparent">
              
              {/* Education Node */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute -left-4 md:static">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="w-full md:w-[calc(50%-2rem)] p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all shadow-lg hover:-translate-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1 block">Education</span>
                  <h4 className="font-bold text-white text-lg">{form.college || 'Add your college'}</h4>
                  <p className="text-gray-400 text-sm mt-1">{form.branch || 'Add your degree/branch'}</p>
                  <p className="text-gray-500 text-xs mt-2">{form.year ? `Class of ${form.year}` : ''}</p>
                </div>
              </div>

              {/* Experience Placeholder Node */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black border-2 border-gray-600 z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute -left-4 md:static opacity-50">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                </div>
                <div className="w-full md:w-[calc(50%-2rem)] p-5 rounded-2xl border border-dashed border-white/10 text-center opacity-50 hover:opacity-100 transition-opacity cursor-not-allowed">
                  <h4 className="font-bold text-gray-400 text-sm mb-1">Add Experience</h4>
                  <p className="text-gray-500 text-xs">This feature is coming soon.</p>
                </div>
              </div>
            </div>
          </div>

          {/* LINKS & RESUME */}
          <div className="stagger-animate glass-panel rounded-[24px] p-6 sm:p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4">
              {editingSection === 'links' ? (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingSection(null); fetchProfile(); }} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
                  <button onClick={() => handleSaveSection('links')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-light text-white rounded-lg transition">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              ) : (
                <button onClick={() => setEditingSection('links')} className="p-2 text-gray-500 hover:text-primary bg-white/5 hover:bg-primary/10 rounded-xl transition opacity-0 group-hover:opacity-100"><Edit3 className="w-4 h-4" /></button>
              )}
            </div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><LinkIcon className="w-5 h-5 text-blue-400" /> Connect & Resume</h2>

            {editingSection === 'links' ? (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="url" value={form.github_url} onChange={e => setForm({...form, github_url: e.target.value})} placeholder="GitHub URL" className="input-glass text-sm bg-transparent" />
                  <input type="url" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="LinkedIn URL" className="input-glass text-sm bg-transparent" />
                  <input type="url" value={form.portfolio_url} onChange={e => setForm({...form, portfolio_url: e.target.value})} placeholder="Portfolio URL" className="input-glass text-sm bg-transparent sm:col-span-2" />
                </div>
                
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-sm">Resume (PDF)</h4>
                    <p className="text-gray-400 text-xs mt-1">Upload your latest CV.</p>
                  </div>
                  <label className="cursor-pointer bg-primary hover:bg-primary-light text-white text-xs font-bold py-2.5 px-5 rounded-xl transition shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
                    {uploadingResume ? `Uploading ${Math.round(resumeProgress)}%` : (form.resume_url ? 'Replace File' : 'Upload File')}
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} disabled={uploadingResume} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {form.github_url && (
                  <a href={form.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 bg-[#24292e] text-white rounded-2xl font-bold text-sm hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(36,41,46,0.4)] transition-all">
                    <i className="fab fa-github text-lg"></i> GitHub
                  </a>
                )}
                {form.linkedin_url && (
                  <a href={form.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 bg-[#0a66c2] text-white rounded-2xl font-bold text-sm hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(10,102,194,0.4)] transition-all">
                    <i className="fab fa-linkedin text-lg"></i> LinkedIn
                  </a>
                )}
                {form.portfolio_url && (
                  <a href={form.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold text-sm hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(236,72,153,0.4)] transition-all">
                    <Globe className="w-5 h-5" /> Portfolio
                  </a>
                )}
                {form.resume_url ? (
                  <a href={form.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-sm hover:-translate-y-1 hover:bg-white/20 hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all w-full sm:w-auto">
                    <FileText className="w-5 h-5 text-emerald-400" /> View Resume
                  </a>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/5 text-gray-500 border border-dashed border-white/20 rounded-2xl font-bold text-sm w-full sm:w-auto">
                    <FileText className="w-5 h-5" /> No Resume Uploaded
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Dummy icon for Career Goal
const RocketIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 3.82-13.82 2 2 0 0 1 3.18 3.18A22 22 0 0 1 12 15z"/>
    <path d="m9 21.5 1.5-1.5"/>
    <path d="m21.5 9-1.5 1.5"/>
  </svg>
);

export default Profile;
