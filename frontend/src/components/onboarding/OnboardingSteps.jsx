import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { uploadProfilePhoto, uploadResume } from '../../utils/storageUtils';
import { auth } from '../../lib/firebase';

// Shared Input Field with Floating Label & Glowing Focus
export const InputField = ({ label, field, type = 'text', required = false, optional = false, data, update, handleBlur, touched, errors }) => {
  const hasValue = data[field] && data[field].toString().length > 0;
  const isError = errors && errors[field] && touched && touched[field];
  
  return (
    <div className="relative group mb-6">
      <input
        type={type}
        id={field}
        value={data[field] || ''}
        onChange={e => update(field, e.target.value)}
        onBlur={() => handleBlur && handleBlur(field)}
        className={`block w-full bg-white/[0.03] border rounded-2xl px-4 pt-6 pb-2.5 text-white text-sm focus:outline-none transition-all duration-300 peer ${
          isError 
            ? 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
            : 'border-white/10 focus:border-primary focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(32,21,255,0.2)] hover:border-white/20'
        }`}
        placeholder=" "
      />
      <label htmlFor={field} className={`absolute left-4 transition-all duration-300 pointer-events-none ${
        hasValue || type === 'date' 
          ? 'top-2 text-[10px] uppercase tracking-widest font-bold text-gray-500' 
          : 'top-4 text-sm text-gray-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:font-bold peer-focus:text-primary'
      }`}>
        {label} {required && <span className="text-red-400">*</span>} {optional && <span className="text-gray-600 font-normal normal-case ml-1 text-[10px]">(Optional)</span>}
      </label>
      
      {/* Animated Focus Bottom Line */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-500 peer-focus:w-full rounded-b-2xl ${isError ? 'bg-red-500' : ''}`} />

      {isError && (
        <p className="text-red-400 text-xs mt-1.5 absolute -bottom-6 left-2 font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
    className={`group relative flex flex-col items-start p-5 rounded-3xl border text-left transition-all duration-500 overflow-hidden ${
      selected 
        ? 'bg-primary/10 border-primary shadow-[0_10px_30px_rgba(32,21,255,0.2)] scale-[1.02] z-10 -translate-y-1' 
        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
    } ${className}`}
  >
    {/* Animated background gradient on hover/active */}
    <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-500 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
    
    <div className="flex w-full justify-between items-start mb-4 relative z-10">
      <div className={`text-4xl transition-all duration-500 origin-bottom-left ${selected ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110 grayscale-[50%] group-hover:grayscale-0'}`}>
        {icon}
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${selected ? 'border-primary bg-primary scale-110 shadow-[0_0_15px_rgba(32,21,255,0.8)]' : 'border-white/10 group-hover:border-white/30'}`}>
        {selected && <svg className="w-3.5 h-3.5 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
      </div>
    </div>
    
    <h3 className={`font-bold text-base mb-1.5 relative z-10 transition-colors duration-300 ${selected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{title}</h3>
    {description && <p className="text-xs text-gray-500 font-medium leading-relaxed relative z-10 group-hover:text-gray-400 transition-colors">{description}</p>}
    
    {/* Ripple Effect Element */}
    {selected && <span className="absolute inset-0 bg-primary/20 animate-ping rounded-3xl pointer-events-none opacity-0" style={{ animationDuration: '1s' }}></span>}
  </button>
);

// Screen 1: Welcome
export const Step1Welcome = ({ onNext }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(".welcome-badge", { y: -20, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" })
        .fromTo(".welcome-title", { y: 30, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: "power3.out" }, "-=0.3")
        .fromTo(".welcome-subtitle", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .fromTo(".welcome-benefit", { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, stagger: 0.08, duration: 0.6, ease: "back.out(1.2)" }, "-=0.4")
        .fromTo(".welcome-btn", { scale: 0.9, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.5)" }, "-=0.2");
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center text-center py-12 w-full max-w-4xl mx-auto">
      <div className="welcome-badge px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary font-bold text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Codovate Early Access
      </div>
      
      <h1 className="welcome-title text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 mb-6 tracking-tight leading-tight">
        Your engineering <br className="hidden sm:block" /> journey begins.
      </h1>
      
      <p className="welcome-subtitle text-gray-400 mt-2 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
        Let's tailor a hyper-personalized ecosystem that guides you from learning to getting hired at your dream company.
      </p>
      
      <div className="mt-14 mb-16 flex flex-wrap justify-center gap-4 w-full">
        {[
          { label: 'AI Career Roadmap', icon: '🚀', color: 'from-blue-500/20 to-blue-600/5' },
          { label: 'Mock Interviews', icon: '🎙️', color: 'from-purple-500/20 to-purple-600/5' },
          { label: 'Resume Builder', icon: '📄', color: 'from-green-500/20 to-green-600/5' },
          { label: 'Live Projects', icon: '🛠️', color: 'from-orange-500/20 to-orange-600/5' },
          { label: 'Team Matching', icon: '👥', color: 'from-pink-500/20 to-pink-600/5' },
        ].map((benefit, i) => (
          <div key={i} className={`welcome-benefit flex items-center gap-3 text-gray-200 bg-gradient-to-br ${benefit.color} backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 hover:border-white/30 transition-all hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]`}>
            <span className="text-2xl drop-shadow-md">{benefit.icon}</span>
            <span className="text-sm font-bold tracking-wide">{benefit.label}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="welcome-btn bg-white text-black hover:bg-gray-200 font-bold py-4 px-12 rounded-full transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 text-lg flex items-center justify-center gap-3 group">
        Let's Go
        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
    <div className="space-y-6">
      <div className="flex flex-col items-center mb-10 w-full">
        <div 
          className={`relative group w-36 h-36 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-500 cursor-pointer shadow-xl ${dragActive ? 'border-primary bg-primary/10 scale-110 shadow-[0_0_30px_rgba(32,21,255,0.4)]' : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-black/80 absolute inset-0 z-20 backdrop-blur-sm">
              <span className="text-white text-[10px] font-bold mb-3 uppercase tracking-widest animate-pulse">Uploading</span>
              <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-200 shadow-[0_0_10px_rgba(32,21,255,0.8)]" style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
              </div>
            </div>
          ) : data.profile_photo ? (
            <img loading="lazy" decoding="async" src={data.profile_photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center group-hover:scale-110 transition-transform duration-500">
              <span className="text-4xl block mb-2 opacity-80 group-hover:opacity-100 drop-shadow-md">📸</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-white transition-colors">Upload</span>
            </div>
          )}
          {!uploading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
               <span className="text-white text-xs font-bold uppercase tracking-wider">{data.profile_photo ? 'Change Photo' : 'Choose Photo'}</span>
               <span className="text-gray-300 text-[10px] mt-1 hidden sm:block font-medium">Drag & Drop</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handleChange} className="hidden" />
        </div>
        
        {showSuccess && (
          <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-green-500 text-white rounded-full p-1.5 animate-bounce z-30 shadow-[0_0_15px_rgba(74,222,128,0.6)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        )}
      </div>

      {/* Choose Avatar Section */}
      <div className="mb-10">
        <p className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-widest text-center">Or Pick an Avatar</p>
        <div className="flex justify-center gap-5">
          {AVATARS.map((av, idx) => (
            <button key={idx} type="button" onClick={() => selectAvatar(av)} className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-300 hover:scale-110 ${data.profile_photo === av ? 'border-primary shadow-[0_0_20px_rgba(32,21,255,0.6)] scale-110 ring-2 ring-primary/30 ring-offset-2 ring-offset-black' : 'border-white/10 hover:border-white/40'}`}>
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
        <div className="relative group mb-6">
          <label className="absolute left-4 top-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 z-10">Current Year <span className="text-red-400">*</span></label>
          <select value={data.year || ''} onChange={e => update('year', e.target.value)} className="block w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 pt-6 pb-2.5 text-white text-sm focus:outline-none focus:border-primary focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(32,21,255,0.2)] appearance-none transition-all duration-300">
            <option value="" className="bg-[#111]">Select Year</option>
            <option value="1" className="bg-[#111]">1st Year</option>
            <option value="2" className="bg-[#111]">2nd Year</option>
            <option value="3" className="bg-[#111]">3rd Year</option>
            <option value="4" className="bg-[#111]">4th Year</option>
          </select>
          {/* Animated Focus Bottom Line */}
          <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-500 group-focus-within:w-full rounded-b-2xl" />
          {errors && errors.year && touched && touched.year && <p className="text-red-400 text-xs mt-1.5 absolute -bottom-6 left-2 font-medium">⚠ {errors.year}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="City" field="city" placeholder="City" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <InputField label="State" field="state" placeholder="State" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <InputField label="Country" field="country" placeholder="Country" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Preferred Language" field="language" placeholder="e.g. English" optional data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <div className="relative group mb-6">
          <label className="absolute left-4 top-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 z-10">Dark Mode Pref</label>
          <select value={data.dark_mode || 'System'} onChange={e => update('dark_mode', e.target.value)} className="block w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 pt-6 pb-2.5 text-white text-sm focus:outline-none focus:border-primary focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(32,21,255,0.2)] appearance-none transition-all duration-300">
            <option value="System" className="bg-[#111]">System Default</option>
            <option value="Dark" className="bg-[#111]">Always Dark (Recommended)</option>
            <option value="Light" className="bg-[#111]">Always Light</option>
          </select>
          <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-500 group-focus-within:w-full rounded-b-2xl" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAREERS.map(c => (
          <button 
            key={c.title} 
            type="button" 
            onClick={() => update('career_goal', c.title)} 
            className={`group relative flex flex-col items-start p-5 rounded-3xl border text-left transition-all duration-500 overflow-hidden ${
              data.career_goal === c.title 
                ? 'bg-primary/10 border-primary shadow-[0_10px_30px_rgba(32,21,255,0.2)] scale-[1.02] z-10 -translate-y-1' 
                : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-500 ${data.career_goal === c.title ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            
            <div className="flex w-full justify-between items-start mb-4 relative z-10">
              <div className={`text-4xl transition-all duration-500 origin-bottom-left ${data.career_goal === c.title ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110 grayscale-[50%] group-hover:grayscale-0'}`}>
                {c.icon}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                  {c.demandIcon} {c.trending}
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${data.career_goal === c.title ? 'border-primary bg-primary scale-110 shadow-[0_0_15px_rgba(32,21,255,0.8)]' : 'border-white/10 group-hover:border-white/30'}`}>
                  {data.career_goal === c.title && <svg className="w-3.5 h-3.5 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </div>
              </div>
            </div>
            
            <h3 className={`font-bold text-base mb-1.5 relative z-10 transition-colors duration-300 ${data.career_goal === c.title ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{c.title}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed relative z-10 group-hover:text-gray-400 transition-colors mb-4">{c.desc}</p>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 relative z-10 mt-auto bg-black/40 px-3 py-1.5 rounded-full border border-white/5">Avg. Salary: <span className="text-primary">{c.salary}</span></div>
          </button>
        ))}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {COMPANIES.map((c, i) => {
          const selected = data.dream_company === c.title;
          return (
            <button
              key={i}
              onClick={() => handleSelect(c)}
              className={`relative group p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all duration-500 ${
                selected 
                  ? 'border-primary bg-primary/10 shadow-[0_10px_30px_rgba(32,21,255,0.2)] -translate-y-1' 
                  : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
              }`}
            >
              {c.logo ? (
                <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center p-2.5 transition-all duration-500 ${selected ? 'scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0'}`}>
                   <img loading="lazy" decoding="async" src={c.logo} alt={c.title} className="w-full h-full object-contain" />
                </div>
              ) : (
                <span className={`text-4xl transition-all duration-500 ${selected ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110 grayscale-[50%] group-hover:grayscale-0'}`}>{c.icon}</span>
              )}
              <span className={`font-bold text-sm transition-colors duration-500 ${selected ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>{c.title}</span>
              
              {selected && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-ping shadow-[0_0_10px_rgba(32,21,255,0.8)]" />}
              {selected && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(32,21,255,0.8)]" />}
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
    <div className="space-y-8">
      <div className="relative group">
        <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder="Search technologies..." 
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white text-sm focus:outline-none focus:border-primary focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(32,21,255,0.2)] transition-all duration-300"
        />
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-500 group-focus-within:w-full rounded-b-2xl" />
      </div>

      <div>
        <div className="flex flex-wrap gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredTech.map(t => (
            <button 
              key={t} 
              type="button" 
              onClick={() => toggleSkill(t)} 
              className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 ${
                hasSkill(t) 
                  ? 'bg-primary border-primary text-white shadow-[0_5px_15px_rgba(32,21,255,0.4)] scale-105 -translate-y-1' 
                  : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/[0.05] hover:text-white hover:-translate-y-0.5'
              }`}
            >
              {t} {hasSkill(t) && '✨'}
            </button>
          ))}
          {searchTerm && !filteredTech.length && (
            <p className="text-sm text-gray-500 py-2">Let's build something amazing. Add your custom skill below.</p>
          )}
        </div>
      </div>
      
      <form onSubmit={addCustom} className="flex gap-3">
        <div className="flex-1 relative group">
          <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)} placeholder="Add custom skill" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(32,21,255,0.2)] transition-all duration-300" />
        </div>
        <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">Add</button>
      </form>

      {data.skills.length > 0 && (
        <div className="space-y-4 mt-8">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Proficiency Levels</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.skills.map(s => (
              <div key={s.name} className="flex flex-col gap-3 p-5 bg-white/[0.02] border border-white/10 rounded-3xl transition-colors hover:border-white/20 hover:bg-white/[0.04]">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {s.name}
                </span>
                <div className="flex bg-black/50 rounded-xl p-1 border border-white/5">
                  {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                    <button key={l} type="button" onClick={() => setLevel(s.name, l)} className={`flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${s.level === l ? 'bg-primary text-white shadow-[0_0_15px_rgba(32,21,255,0.4)] scale-105' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
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
    <div className="space-y-10">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">How do you love learning?</label>
        <div className="grid grid-cols-2 gap-4">
          {STYLES.map(s => (
            <InteractiveCard key={s.title} title={s.title} icon={s.icon} selected={data.learning_style === s.title} onClick={() => update('learning_style', s.title)} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Daily Learning Time</label>
        <div className="grid grid-cols-2 gap-4">
          {TIMES.map(t => (
            <InteractiveCard key={t.title} title={t.title} icon={t.icon} selected={data.daily_time === t.title} onClick={() => update('daily_time', t.title)} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Placement Goal</label>
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
export const Step8Experience = ({ data, update, handleBlur, touched, errors }) => {
  return (
    <div className="space-y-6">
      <InputField label="GitHub Profile URL" field="github" placeholder="https://github.com/..." optional data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      <InputField label="LinkedIn Profile URL" field="linkedin" placeholder="https://linkedin.com/in/..." optional data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      <InputField label="Portfolio/Website URL" field="portfolio" placeholder="https://..." optional data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      
      <div className="mt-8 pt-8 border-t border-white/10">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Experience Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InteractiveCard title="Beginner" description="Just starting out, eager to learn" icon="🌱" selected={data.experience_level === 'Beginner'} onClick={() => update('experience_level', 'Beginner')} />
          <InteractiveCard title="Intermediate" description="Have built some projects" icon="🚀" selected={data.experience_level === 'Intermediate'} onClick={() => update('experience_level', 'Intermediate')} />
          <InteractiveCard title="Advanced" description="Comfortable with complex apps" icon="⚡" selected={data.experience_level === 'Advanced'} onClick={() => update('experience_level', 'Advanced')} />
        </div>
      </div>
    </div>
  );
};

// Live Profile Preview
export const LiveProfilePreview = ({ data, step }) => {
  return (
    <div className="hidden lg:block w-80 shrink-0 sticky top-24 self-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full border-2 border-primary/50 overflow-hidden mb-4 shadow-[0_0_20px_rgba(32,21,255,0.3)] bg-[#111]">
            {data.profile_photo ? (
              <img loading="lazy" decoding="async" src={data.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{data.name || 'Your Name'}</h3>
          <p className="text-sm text-gray-400 font-medium">{data.career_goal || 'Future Engineer'}</p>
        </div>

        {data.skills?.length > 0 && (
          <div className="mt-8">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Top Skills</p>
            <div className="flex flex-wrap gap-2">
              {data.skills.slice(0, 5).map(s => (
                <span key={s.name} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-semibold text-gray-300">
                  {s.name}
                </span>
              ))}
              {data.skills.length > 5 && (
                <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-semibold text-gray-500">
                  +{data.skills.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {data.dream_company && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Target Company</p>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
              <span className="text-xl">🏢</span>
              <span className="text-sm font-bold text-white">{data.dream_company}</span>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
          <span>Completion</span>
          <span className="text-primary">{Math.round(((step - 1) / 7) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden shadow-inner">
          <div className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(32,21,255,0.8)]" style={{ width: `${((step - 1) / 7) * 100}%` }} />
        </div>
      </div>
    </div>
  );
};
