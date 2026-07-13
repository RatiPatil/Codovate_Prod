import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// Shared Input Field
export const InputField = ({ label, field, placeholder, type = 'text', required = false, optional = false, data, update, handleBlur, touched, errors }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
      {label} {required && <span className="text-red-400">*</span>} {optional && <span className="text-gray-500 font-normal normal-case">(Optional)</span>}
    </label>
    <input
      type={type}
      value={data[field] || ''}
      onChange={e => update(field, e.target.value)}
      onBlur={() => handleBlur && handleBlur(field)}
      placeholder={placeholder}
      className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
        errors && errors[field] && touched && touched[field]
          ? 'border-red-500/60 focus:ring-red-500/20 focus:border-red-500'
          : 'border-white/10 focus:ring-primary/20 focus:border-primary'
      }`}
    />
    {errors && errors[field] && touched && touched[field] && (
      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
        <span>⚠</span> {errors[field]}
      </p>
    )}
  </div>
);

// Screen 1: Welcome
export const Step1Welcome = ({ onNext }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(".welcome-title", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" })
      .fromTo(".welcome-subtitle", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, "-=0.4")
      .fromTo(".welcome-desc", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, "-=0.4")
      .fromTo(".welcome-benefit", { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" }, "-=0.2")
      .fromTo(".welcome-btn", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.2");
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center text-center py-8">
      <h1 className="welcome-title text-4xl font-bold text-white mb-2">Welcome to Codovate 👋</h1>
      <h2 className="welcome-subtitle text-xl font-semibold text-primary mb-4">Your AI Career Operating System</h2>
      <p className="welcome-desc text-gray-400 max-w-md mx-auto mb-8 text-sm">
        We'll personalize your learning journey, career roadmap, opportunities and dashboard.
      </p>
      
      <div className="text-left space-y-3 mb-10">
        {['Personalized Dashboard', 'AI Career Roadmap', 'Smart Recommendations', 'Coding Practice', 'Resume Insights', 'Internship Suggestions'].map((benefit, i) => (
          <div key={i} className="welcome-benefit flex items-center gap-3 text-gray-300">
            <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium">{benefit}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="welcome-btn bg-primary hover:bg-primary-hover text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 w-full sm:w-auto">
        Let's Get Started
      </button>
    </div>
  );
};

// Screen 2: Basic Information
export const Step2BasicInfo = ({ data, update, touched, handleBlur, errors }) => {
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => update('profile_photo', reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center mb-6">
        <div className="relative group cursor-pointer mb-2">
          <div className="w-24 h-24 rounded-full border-2 border-white/10 bg-[#0a0a0a] overflow-hidden flex items-center justify-center relative">
            {data.profile_photo ? (
              <img src={data.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white font-medium">Upload</span>
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
        <span className="text-xs text-gray-500">Profile Photo (Optional)</span>
      </div>

      <InputField label="Full Name" field="full_name" placeholder="John Doe" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="College" field="college" placeholder="Your College" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
        <InputField label="Course" field="course" placeholder="e.g. B.Tech" required data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors} />
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
    </div>
  );
};

// Screen 3: Career Vision
export const Step3CareerVision = ({ data, update }) => {
  const CAREERS = ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'AI Engineer', 'Data Scientist', 'Cyber Security', 'Cloud Engineer', 'Flutter Developer', 'DevOps', 'UI/UX', 'Startup Founder', 'Other'];
  const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Adobe', 'Netflix', 'Startup', 'Other'];
  const PLACEMENTS = ['3 Months', '6 Months', '12 Months', 'No Timeline'];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-3">What do you want to become?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CAREERS.map(c => (
            <button key={c} type="button" onClick={() => update('career_goal', c)} className={`p-3 rounded-xl border text-sm font-medium transition-all ${data.career_goal === c ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Dream Company</label>
        <div className="flex flex-wrap gap-2">
          {COMPANIES.map(c => (
            <button key={c} type="button" onClick={() => update('dream_company', c)} className={`px-4 py-2 rounded-full border text-sm transition-all ${data.dream_company === c ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Placement Goal</label>
        <div className="flex flex-wrap gap-2">
          {PLACEMENTS.map(p => (
            <button key={p} type="button" onClick={() => update('placement_goal', p)} className={`px-4 py-2 rounded-full border text-sm transition-all ${data.placement_goal === p ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Screen 4: Current Skills
export const Step4Skills = ({ data, update }) => {
  const TECH = ['Java', 'Python', 'React', 'Node', 'SQL', 'Firebase', 'Spring Boot', 'Flutter', 'AWS', 'Docker', 'Git', 'MongoDB'];
  const [customSkill, setCustomSkill] = useState('');

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

  const addCustom = () => {
    if (customSkill.trim() && !hasSkill(customSkill.trim())) {
      update('skills', [...data.skills, { name: customSkill.trim(), level: 'Beginner' }]);
      setCustomSkill('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Which technologies do you already know?</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {TECH.map(t => (
            <button key={t} type="button" onClick={() => toggleSkill(t)} className={`px-4 py-2 rounded-full border text-sm transition-all ${hasSkill(t) ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {t} {hasSkill(t) && '✓'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)} placeholder="Add custom skill" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary" />
          <button type="button" onClick={addCustom} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">Add</button>
        </div>
      </div>

      {data.skills.length > 0 && (
        <div className="space-y-3 mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Proficiency Levels</label>
          {data.skills.map(s => (
            <div key={s.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/40 rounded-lg">
              <span className="text-white font-medium">{s.name}</span>
              <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
                {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                  <button key={l} type="button" onClick={() => setLevel(s.name, l)} className={`px-3 py-1.5 text-xs font-medium transition-all ${s.level === l ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Screen 5: Interests
export const Step5Interests = ({ data, update }) => {
  const INTERESTS = ['Internship', 'Job', 'Hackathon', 'Research', 'Startup', 'Freelancing', 'Open Source', 'Competitive Programming', 'Networking'];
  
  const toggle = (i) => {
    if (data.interests.includes(i)) update('interests', data.interests.filter(x => x !== i));
    else update('interests', [...data.interests, i]);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-4">What are you interested in?</label>
      <div className="grid grid-cols-2 gap-3">
        {INTERESTS.map(i => (
          <button key={i} type="button" onClick={() => toggle(i)} className={`p-4 rounded-xl border text-left transition-all ${data.interests.includes(i) ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{i}</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${data.interests.includes(i) ? 'border-primary bg-primary' : 'border-white/20'}`}>
                {data.interests.includes(i) && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Screen 6: Learning Preferences
export const Step6Learning = ({ data, update }) => {
  const STYLES = ['Videos', 'Projects', 'Reading', 'Mentorship', 'Practice'];
  const TIMES = ['30 Minutes', '1 Hour', '2 Hours', '3+ Hours'];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Preferred Learning Style</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button key={s} type="button" onClick={() => update('learning_style', s)} className={`px-4 py-2 rounded-full border text-sm transition-all ${data.learning_style === s ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Daily Learning Time</label>
        <div className="flex flex-wrap gap-2">
          {TIMES.map(t => (
            <button key={t} type="button" onClick={() => update('daily_time', t)} className={`px-4 py-2 rounded-full border text-sm transition-all ${data.daily_time === t ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Screen 7: Experience
export const Step7Experience = ({ data, update }) => {
  const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
  const PROJECTS = ['None', '1–2', '3–5', '5+'];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Current Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LEVELS.map(l => (
            <button key={l} type="button" onClick={() => update('experience_level', l)} className={`p-4 rounded-xl border text-center transition-all ${data.experience_level === l ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              <span className="font-semibold">{l}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Projects Built</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PROJECTS.map(p => (
            <button key={p} type="button" onClick={() => update('projects_built', p)} className={`py-3 rounded-xl border text-center transition-all ${data.projects_built === p ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              <span className="font-semibold">{p}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Screen 8: Professional Links
export const Step8Links = ({ data, update }) => {
  return (
    <div className="space-y-4">
      <InputField label="GitHub URL" field="github_url" placeholder="https://github.com/..." optional data={data} update={update} touched={{}} errors={{}} />
      <InputField label="LinkedIn URL" field="linkedin_url" placeholder="https://linkedin.com/in/..." optional data={data} update={update} touched={{}} errors={{}} />
      <InputField label="Portfolio URL" field="portfolio_url" placeholder="https://yourwebsite.com" optional data={data} update={update} touched={{}} errors={{}} />
      <div className="grid grid-cols-2 gap-4 pt-2">
        <InputField label="LeetCode URL" field="leetcode_url" placeholder="https://leetcode.com/..." optional data={data} update={update} touched={{}} errors={{}} />
        <InputField label="CodeChef URL" field="codechef_url" placeholder="https://codechef.com/..." optional data={data} update={update} touched={{}} errors={{}} />
      </div>
      <div className="pt-4 border-t border-white/10">
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Resume Upload <span className="text-gray-500 font-normal normal-case">(Optional)</span></label>
        <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-white/5 relative group">
          <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => alert('Resume upload will be handled by Firebase Storage in full implementation.')} />
          <svg className="w-8 h-8 mx-auto text-gray-500 mb-3 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm font-medium text-white block group-hover:text-primary transition-colors">Upload Resume (PDF)</span>
          <span className="text-xs text-gray-500 mt-1 block">Drag and drop or click to browse</span>
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
            <img src={data.profile_photo} alt="Avatar" className="w-full h-full object-cover" />
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
          <p className="text-xs text-gray-400">{data.course} {data.branch ? `- ${data.branch}` : ''} {data.year ? `(Year ${data.year})` : ''}</p>
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
        <span className="text-primary font-bold">{Math.round((step / 9) * 100)}%</span>
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 9) * 100}%` }} />
      </div>
    </div>
  );
};
