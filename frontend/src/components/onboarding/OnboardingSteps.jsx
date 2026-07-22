import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { uploadProfilePhoto, uploadResume } from '../../utils/storageUtils';
import { auth } from '../../lib/firebase';

// Shared Input Field with Floating Label
export const InputField = ({ label, field, type = 'text', required = false, optional = false, data, update, handleBlur, touched, errors }) => {
  const hasValue = data[field] && data[field].toString().length > 0;
  const isError = errors && errors[field] && touched && touched[field];
  
  return (
    <div className="relative group mb-5">
      <input
        type={type}
        id={field}
        value={data[field] || ''}
        onChange={e => update(field, e.target.value)}
        onBlur={() => handleBlur && handleBlur(field)}
        className={`block w-full bg-white/5 border rounded-xl px-4 pt-5 pb-2 text-white text-sm focus:outline-none transition-all duration-300 peer ${
          isError ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-white/20'
        }`}
        placeholder=" "
      />
      <label htmlFor={field} className={`absolute left-4 text-gray-500 transition-all duration-300 pointer-events-none ${
        hasValue || type === 'date' ? 'top-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400' : 'top-3.5 text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider peer-focus:font-semibold peer-focus:text-primary'
      }`}>
        {label} {required && <span className="text-red-400">*</span>} {optional && <span className="text-gray-600 font-normal normal-case">(Optional)</span>}
      </label>
      {isError && (
        <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1">
          {errors[field]}
        </p>
      )}
    </div>
  );
};

// Premium Interactive Card
export const InteractiveCard = ({ title, description, icon, selected, onClick, className = '' }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className={`group relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
      selected 
        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(32,21,255,0.15)] scale-[1.02] z-10' 
        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:-translate-y-1'
    } ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="flex w-full justify-between items-start mb-3 relative z-10">
      <div className={`text-2xl transition-transform duration-300 ${selected ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${selected ? 'border-primary bg-primary scale-110' : 'border-white/20'}`}>
        {selected && <svg className="w-3 h-3 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
      </div>
    </div>
    
    <h3 className={`font-semibold text-sm mb-1 relative z-10 transition-colors duration-300 ${selected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{title}</h3>
    {description && <p className="text-xs text-gray-500 line-clamp-2 relative z-10">{description}</p>}
    
    {/* Ripple Effect Element */}
    {selected && <span className="absolute inset-0 bg-primary/20 animate-ping rounded-2xl pointer-events-none opacity-0" style={{ animationDuration: '0.8s' }}></span>}
  </button>
);

// Screen 1: Welcome
export const Step1Welcome = ({ onNext }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(".welcome-title", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" })
        .fromTo(".welcome-subtitle", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, "-=0.4")
        .fromTo(".welcome-benefit", { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" }, "-=0.2")
        .fromTo(".welcome-btn", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.2");
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center text-center py-8 w-full">
      <h1 className="welcome-title text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">Let's build your AI Career Workspace.</h1>
      <p className="welcome-subtitle text-gray-400 mt-4 text-lg">Your personalized ecosystem for learning, building, and getting hired.</p>
      
      <div className="text-left mt-10 mb-12 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full max-w-2xl mx-auto">
        {[
          { label: 'AI Career Roadmap', icon: '🚀' },
          { label: 'Coding Practice', icon: '💻' },
          { label: 'Resume Builder', icon: '📄' },
          { label: 'Placement Readiness', icon: '🎯' },
          { label: 'Team Matching', icon: '👥' },
          { label: 'Mentor Recommendations', icon: '🎓' },
          { label: 'AI Career Coach', icon: '✨' }
        ].map((benefit, i) => (
          <div key={i} className="welcome-benefit flex items-center gap-4 text-gray-300 bg-white/5 px-5 py-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5">
            <span className="text-2xl">{benefit.icon}</span>
            <span className="text-sm font-semibold">{benefit.label}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="welcome-btn bg-primary hover:bg-primary-hover text-white font-bold py-4 px-12 rounded-xl transition-all shadow-[0_0_20px_rgba(32,21,255,0.4)] hover:shadow-[0_0_30px_rgba(32,21,255,0.6)] hover:scale-105 w-full sm:w-auto text-lg flex items-center justify-center gap-3">
        Start My Journey
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
};

// Screen 2: Basic Information
export const Step2BasicInfo = ({ data, update, touched, handleBlur, errors }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Destiny'
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uid = auth.currentUser?.uid || 'temp_user';
      const downloadUrl = await uploadProfilePhoto(file, uid, (progress) => {
        setUploadProgress(progress);
      });
      update('profile_photo', downloadUrl);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removePhoto = () => update('profile_photo', null);
  const selectAvatar = (url) => {
    update('profile_photo', url);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center mb-8 w-full">
        <div 
          className={`relative group w-32 h-32 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer ${dragActive ? 'border-primary bg-primary/10 scale-105' : 'border-white/10 bg-[#0a0a0a] hover:border-white/30'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-black/80 absolute inset-0 z-20">
              <span className="text-white text-[10px] font-bold mb-2">Cropping & Uploading</span>
              <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-200" style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
              </div>
            </div>
          ) : data.profile_photo ? (
            <img loading="lazy" decoding="async" src={data.profile_photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <span className="text-3xl block mb-1">📸</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Upload</span>
            </div>
          )}
          {!uploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-white text-xs font-semibold">{data.profile_photo ? 'Change Photo' : 'Choose Photo'}</span>
               <span className="text-gray-400 text-[10px] mt-1 hidden sm:block">drag & drop / take photo</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handleChange} className="hidden" />
        </div>
        {showSuccess && (
          <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-green-500 text-white rounded-full p-1 animate-bounce z-30">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        )}
      </div>

      {/* Choose Avatar Section */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider text-center">Or Choose Avatar</p>
        <div className="flex justify-center gap-4">
          {AVATARS.map((av, idx) => (
            <button key={idx} type="button" onClick={() => selectAvatar(av)} className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${data.profile_photo === av ? 'border-primary shadow-[0_0_15px_rgba(32,21,255,0.5)] scale-110' : 'border-white/10 hover:border-white/30'}`}>
              <img loading="lazy" decoding="async" src={av} alt="Avatar option" className="w-full h-full object-cover bg-white" />
            </button>
          ))}
        </div>
      </div>

      <InputField label="Full Name" field="full_name" placeholder="John Doe" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="College" field="college" placeholder="Your College" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <InputField label="Degree" field="degree" placeholder="e.g. B.Tech" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Branch" field="branch" placeholder="e.g. CSE" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Current Year <span className="text-red-400">*</span></label>
          <select value={data.year || ''} onChange={e => update('year', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary appearance-none">
            <option value="" className="bg-[#0a0a0a]">Select Year</option>
            <option value="1" className="bg-[#0a0a0a]">1st Year</option>
            <option value="2" className="bg-[#0a0a0a]">2nd Year</option>
            <option value="3" className="bg-[#0a0a0a]">3rd Year</option>
            <option value="4" className="bg-[#0a0a0a]">4th Year</option>
          </select>
          {errors && errors.year && touched && touched.year && <p className="text-red-400 text-xs mt-1">⚠ {errors.year}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="City" field="city" placeholder="City" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <InputField label="State" field="state" placeholder="State" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <InputField label="Country" field="country" placeholder="Country" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Preferred Language" field="language" placeholder="e.g. English" optional data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Dark Mode Pref</label>
          <select value={data.dark_mode || 'System'} onChange={e => update('dark_mode', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary appearance-none">
            <option value="System" className="bg-[#0a0a0a]">System</option>
            <option value="Dark" className="bg-[#0a0a0a]">Dark</option>
            <option value="Light" className="bg-[#0a0a0a]">Light</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Screen 3: Career Vision
export const Step3CareerVision = ({ data, update }) => {
  const CAREERS = [
    { title: 'Backend Developer', icon: '⚙️', desc: 'Build APIs, databases, and server logic.', salary: '$120k+', trending: 'High Demand', demandIcon: '🔥' },
    { title: 'Frontend Developer', icon: '🎨', desc: 'Create beautiful user interfaces.', salary: '$110k+', trending: 'Hot', demandIcon: '📈' },
    { title: 'Full Stack', icon: '🥞', desc: 'Master both frontend and backend.', salary: '$130k+', trending: 'Very High', demandIcon: '🚀' },
    { title: 'AI Engineer', icon: '🧠', desc: 'Build machine learning models.', salary: '$150k+', trending: 'Exploding', demandIcon: '💥' },
    { title: 'Machine Learning Engineer', icon: '🤖', desc: 'Design intelligent systems.', salary: '$145k+', trending: 'High', demandIcon: '⚡' },
    { title: 'Data Scientist', icon: '📊', desc: 'Extract insights from data.', salary: '$140k+', trending: 'High', demandIcon: '💹' },
    { title: 'Cyber Security', icon: '🛡️', desc: 'Protect systems and networks.', salary: '$125k+', trending: 'Crucial', demandIcon: '🔒' },
    { title: 'Cloud Engineer', icon: '☁️', desc: 'Design cloud infrastructure.', salary: '$130k+', trending: 'High', demandIcon: '🌐' },
    { title: 'Flutter Developer', icon: '📱', desc: 'Build cross-platform mobile apps.', salary: '$115k+', trending: 'Steady', demandIcon: '📈' },
    { title: 'DevOps', icon: '♾️', desc: 'Bridge development and operations.', salary: '$135k+', trending: 'High Demand', demandIcon: '🔥' },
    { title: 'Game Developer', icon: '🎮', desc: 'Create interactive experiences.', salary: '$105k+', trending: 'Growing', demandIcon: '🕹️' },
    { title: 'Startup Founder', icon: '🦄', desc: 'Build the next big thing.', salary: 'Limitless', trending: 'High Risk/Reward', demandIcon: '🚀' },
    { title: 'Product Manager', icon: '📋', desc: 'Lead product strategy and vision.', salary: '$135k+', trending: 'High', demandIcon: '⭐' },
    { title: 'Other', icon: '✨', desc: 'Forging your own unique path.', salary: 'Varies', trending: 'Unique', demandIcon: '🌟' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-semibold text-white mb-4">What do you dream of becoming?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAREERS.map(c => (
            <button 
              key={c.title} 
              type="button" 
              onClick={() => update('career_goal', c.title)} 
              className={`group relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                data.career_goal === c.title 
                  ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(32,21,255,0.15)] scale-[1.02] z-10' 
                  : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:-translate-y-1'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex w-full justify-between items-start mb-3 relative z-10">
                <div className={`text-3xl transition-transform duration-300 ${data.career_goal === c.title ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {c.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center gap-1">
                    {c.demandIcon} {c.trending}
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${data.career_goal === c.title ? 'border-primary bg-primary scale-110' : 'border-white/20'}`}>
                    {data.career_goal === c.title && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                </div>
              </div>
              
              <h3 className={`font-semibold text-base mb-1 relative z-10 transition-colors duration-300 ${data.career_goal === c.title ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>{c.title}</h3>
              <p className="text-xs text-gray-500 mb-3 relative z-10">{c.desc}</p>
              <div className="text-xs font-medium text-gray-400 relative z-10 mt-auto">Avg. Salary: <span className="text-white">{c.salary}</span></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Screen 4: Dream Company
export const Step4DreamCompany = ({ data, update }) => {
  const COMPANIES = [
    { title: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' },
    { title: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
    { title: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
    { title: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png' },
    { title: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
    { title: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { title: 'OpenAI', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
    { title: 'Startup', icon: '🚀' },
    { title: 'Own Startup', icon: '👑' },
    { title: 'Other', icon: '✨' }
  ];

  const handleSelect = (c) => update('dream_company', c.title);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Dream Company</h2>
        <p className="text-sm text-gray-400">Where do you want to work?</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {COMPANIES.map((c, i) => {
          const selected = data.dream_company === c.title;
          return (
            <button
              key={i}
              onClick={() => handleSelect(c)}
              className={`relative group p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                selected 
                  ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(32,21,255,0.2)]' 
                  : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {c.logo ? (
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 transition-transform duration-300 ${selected ? 'scale-110' : 'group-hover:scale-110'}`}>
                   <img loading="lazy" decoding="async" src={c.logo} alt={c.title} className="w-full h-full object-contain" />
                </div>
              ) : (
                <span className={`text-2xl transition-transform duration-300 ${selected ? 'scale-110' : 'group-hover:scale-110'}`}>{c.icon}</span>
              )}
              <span className={`font-medium text-sm transition-colors duration-300 ${selected ? 'text-primary' : 'text-gray-300 group-hover:text-white'}`}>{c.title}</span>
              {selected && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-ping"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Screen 5: Current Skills
export const Step5Skills = ({ data, update }) => {
  const TECH = ['Java', 'Python', 'React', 'Node', 'SQL', 'Firebase', 'Spring Boot', 'Flutter', 'AWS', 'Docker', 'Git', 'GitHub', 'Linux', 'Networking', 'Cyber Security', 'MongoDB'];
  const [customSkill, setCustomSkill] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const hasSkill = (name) => data.skills.some(s => s.name === name);
  const getSkillLevel = (name) => {
    const s = data.skills.find(x => x.name === name);
    return s ? s.level : null;
  };

  const toggleSkill = (name) => {
    if (hasSkill(name)) {
      update('skills', data.skills.filter(s => s.name !== name));
    } else {
      update('skills', [...data.skills, { name, level: 'Beginner' }]);
    }
  };

  const setLevel = (name, level) => {
    update('skills', data.skills.map(s => s.name === name ? { ...s, level } : s));
  };

  const addCustom = (e) => {
    e?.preventDefault();
    if (customSkill.trim() && !hasSkill(customSkill.trim())) {
      update('skills', [...data.skills, { name: customSkill.trim(), level: 'Beginner' }]);
      setCustomSkill('');
    }
  };

  const filteredTech = TECH.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder="Search technologies..." 
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <div className="flex flex-wrap gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredTech.map(t => (
            <button 
              key={t} 
              type="button" 
              onClick={() => toggleSkill(t)} 
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
                hasSkill(t) 
                  ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(32,21,255,0.3)] scale-105' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              {t} {hasSkill(t) && '✓'}
            </button>
          ))}
          {searchTerm && !filteredTech.length && (
            <p className="text-sm text-gray-500 py-2">Let's build something amazing. Add your custom skill below.</p>
          )}
        </div>
      </div>
      
      <form onSubmit={addCustom} className="flex gap-2">
        <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)} placeholder="Add custom skill" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-colors" />
        <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105">Add</button>
      </form>

      {data.skills.length > 0 && (
        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <p className="text-primary font-bold">Awesome!</p>
            <p className="text-sm text-primary/80">You already know {data.skills.length} skill{data.skills.length > 1 ? 's' : ''}. Set their levels below.</p>
          </div>
        </div>
      )}

      {data.skills.length > 0 && (
        <div className="space-y-3 mt-6">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Proficiency Levels</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.skills.map(s => (
              <div key={s.name} className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-xl transition-colors hover:border-white/20">
                <span className="text-white font-semibold">{s.name}</span>
                <div className="flex bg-black/40 rounded-lg p-1">
                  {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                    <button key={l} type="button" onClick={() => setLevel(s.name, l)} className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${s.level === l ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Screen 6: Interests
export const Step6Interests = ({ data, update }) => {
  const INTERESTS = [
    { title: 'Internship', icon: '🏢' },
    { title: 'Job', icon: '💼' },
    { title: 'Hackathon', icon: '🏆' },
    { title: 'Research', icon: '🔬' },
    { title: 'Freelancing', icon: '💻' },
    { title: 'Competitive Programming', icon: '⚡' },
    { title: 'Startup', icon: '🚀' },
    { title: 'Open Source', icon: '🌐' },
    { title: 'Mentorship', icon: '🤝' },
    { title: 'Networking', icon: '👥' }
  ];
  
  const toggle = (i) => {
    if (data.interests.includes(i)) update('interests', data.interests.filter(x => x !== i));
    else update('interests', [...data.interests, i]);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-4">What are you interested in?</label>
      <div className="grid grid-cols-2 gap-4">
        {INTERESTS.map(i => (
          <InteractiveCard 
            key={i.title} 
            title={i.title} 
            icon={i.icon} 
            selected={data.interests.includes(i.title)} 
            onClick={() => toggle(i.title)} 
          />
        ))}
      </div>
    </div>
  );
};

// Screen 7: Learning Preferences
export const Step7Learning = ({ data, update }) => {
  const STYLES = [
    { title: 'Videos', icon: '🎬' },
    { title: 'Projects', icon: '🛠️' },
    { title: 'Practice', icon: '💻' },
    { title: 'Reading', icon: '📚' },
    { title: 'Mentor', icon: '🤝' },
    { title: 'Live Classes', icon: '🎥' }
  ];
  const TIMES = [
    { title: '30 mins', icon: '⏱️' },
    { title: '1 hour', icon: '⏳' },
    { title: '2 hours', icon: '🕰️' },
    { title: '3+ hours', icon: '🚀' }
  ];
  const PLACEMENTS = [
    { title: '3 months', icon: '🔥' },
    { title: '6 months', icon: '⚡' },
    { title: '12 months', icon: '🌱' },
    { title: 'No deadline', icon: '☕' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-semibold text-white mb-4">How do you love learning?</label>
        <div className="grid grid-cols-2 gap-4">
          {STYLES.map(s => (
            <InteractiveCard key={s.title} title={s.title} icon={s.icon} selected={data.learning_style === s.title} onClick={() => update('learning_style', s.title)} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-4">Daily Learning Time</label>
        <div className="grid grid-cols-2 gap-4">
          {TIMES.map(t => (
            <InteractiveCard key={t.title} title={t.title} icon={t.icon} selected={data.daily_time === t.title} onClick={() => update('daily_time', t.title)} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-4">Placement Goal</label>
        <div className="grid grid-cols-2 gap-4">
          {PLACEMENTS.map(p => (
            <InteractiveCard 
              key={p.title} 
              title={p.title} 
              icon={p.icon} 
              selected={data.placement_goal === p.title} 
              onClick={() => update('placement_goal', p.title)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Screen 8: Projects & Experience
export const Step8Experience = ({ data, update }) => {
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Resume file size must be less than 5MB');
      return;
    }
    
    setUploadingResume(true);
    setResumeProgress(0);
    try {
      const uid = auth.currentUser?.uid || 'temp_user';
      const downloadUrl = await uploadResume(file, uid, (progress) => {
        setResumeProgress(progress);
      });
      update('resume_url', downloadUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const LEVELS = [
    { title: 'Beginner', icon: '👶', desc: 'Just starting out.' },
    { title: 'Intermediate', icon: '🧑‍💻', desc: 'Built a few things.' },
    { title: 'Advanced', icon: '🧙‍♂️', desc: 'Comfortable with complex logic.' }
  ];
  const PROJECTS = ['0', '1-2', '3-5', '5+'];

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-semibold text-white mb-4">Current Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {LEVELS.map(l => (
            <InteractiveCard key={l.title} title={l.title} icon={l.icon} description={l.desc} selected={data.experience_level === l.title} onClick={() => update('experience_level', l.title)} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-4">How many projects have you built?</label>
        <div className="flex flex-wrap gap-3 mb-8">
          {PROJECTS.map(p => (
            <button key={p} type="button" onClick={() => update('projects_built', p)} className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all ${data.projects_built === p ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(32,21,255,0.3)] scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-4">Professional Links</label>
        <div className="space-y-4">
          <InputField label="GitHub URL" field="github_url" placeholder="https://github.com/..." optional data={data} update={update} touched={{}} errors={{}} />
          <InputField label="LinkedIn URL" field="linkedin_url" placeholder="https://linkedin.com/in/..." optional data={data} update={update} touched={{}} errors={{}} />
          <InputField label="Portfolio URL" field="portfolio_url" placeholder="https://yourwebsite.com" optional data={data} update={update} touched={{}} errors={{}} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <InputField label="LeetCode" field="leetcode_url" placeholder="https://leetcode.com/..." optional data={data} update={update} touched={{}} errors={{}} />
            <InputField label="CodeChef" field="codechef_url" placeholder="https://codechef.com/..." optional data={data} update={update} touched={{}} errors={{}} />
            <InputField label="HackerRank" field="hackerrank_url" placeholder="https://hackerrank.com/..." optional data={data} update={update} touched={{}} errors={{}} />
          </div>
          <div className="pt-4 border-t border-white/10">
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Resume Upload <span className="text-gray-500 font-normal normal-case">(Optional)</span></label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-white/5 relative group cursor-pointer">
              {uploadingResume ? (
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-white text-[10px] font-bold mb-2">Uploading Resume... {Math.round(resumeProgress)}%</span>
                  <div className="w-full max-w-[150px] h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-200" style={{ width: `${Math.min(resumeProgress, 100)}%` }} />
                  </div>
                </div>
              ) : data.resume_url ? (
                <div className="flex flex-col items-center justify-center py-2">
                  <svg className="w-8 h-8 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-400 block mb-1">Resume Uploaded Successfully!</span>
                  <a href={data.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline z-10 relative">View Resume</a>
                  
                  {/* Provide a way to replace the resume */}
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-0" onChange={handleResumeUpload} />
                </div>
              ) : (
                <>
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleResumeUpload} />
                  <svg className="w-8 h-8 mx-auto text-gray-500 mb-3 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm font-medium text-white block group-hover:text-primary transition-colors">Upload Resume (PDF)</span>
                  <span className="text-xs text-gray-500 mt-1 block">Drag and drop or click to browse</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Live Profile Preview
export const LiveProfilePreview = ({ data, step }) => {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden glass-panel flex flex-col p-6 h-full min-h-[400px]">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
          {data.profile_photo ? (
            <img loading="lazy" decoding="async" src={data.profile_photo} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{data.full_name || 'Your Name'}</h3>
          <p className="text-xs text-primary">{data.career_goal || 'Future Innovator'}</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Education</p>
          <p className="text-sm text-gray-200">{data.college || 'College Name'}</p>
          <p className="text-xs text-gray-400">{data.degree} {data.branch ? `- ${data.branch}` : ''} {data.year ? `(Year ${data.year})` : ''}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Top Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.length > 0 ? data.skills.slice(0, 4).map(s => (
              <span key={s.name} className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full font-medium">
                {s.name}
              </span>
            )) : <span className="text-xs text-gray-500 italic">No skills added yet</span>}
            {data.skills.length > 4 && <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-[10px] rounded-full font-medium">+{data.skills.length - 4} more</span>}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Career Goal</p>
          <p className="text-sm text-gray-200">{data.dream_company || 'Dream Company'}</p>
          <p className="text-xs text-gray-400">Target: {data.placement_goal || 'Timeline'}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
        <span>Completion</span>
        <span className="text-primary font-bold">{Math.round((step / 8) * 100)}%</span>
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 8) * 100}%` }} />
      </div>
    </div>
  );
};
