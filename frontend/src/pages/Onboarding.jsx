import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { locationData } from '../utils/locationData';
import confetti from 'canvas-confetti';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: '👤', desc: 'Basic information about you' },
  { id: 2, title: 'Academic Details', icon: '🎓', desc: 'Your college and education' },
  { id: 3, title: 'Career Goal', icon: '🎯', desc: 'Where you want to go' },
  { id: 4, title: 'Skills', icon: '⚡', desc: 'Your technical strengths' },
  { id: 5, title: 'Portfolio', icon: '🔗', desc: 'Your work and presence' },
];

const CAREER_GOALS = [
  { value: 'software_engineer', label: 'Software Engineer', icon: '💻' },
  { value: 'data_scientist', label: 'Data Scientist', icon: '📊' },
  { value: 'product_manager', label: 'Product Manager', icon: '🚀' },
  { value: 'designer', label: 'UI/UX Designer', icon: '🎨' },
  { value: 'entrepreneur', label: 'Entrepreneur', icon: '🏢' },
  { value: 'researcher', label: 'Researcher', icon: '🔬' },
  { value: 'consultant', label: 'Consultant', icon: '📋' },
  { value: 'other', label: 'Other', icon: '✨' },
];

const INTERESTS = [
  'Web Development', 'Mobile Apps', 'Machine Learning', 'Data Science',
  'Cybersecurity', 'Cloud Computing', 'Blockchain', 'IoT',
  'Game Development', 'DevOps', 'Open Source', 'Startups',
];

const ALL_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'TypeScript',
  'Flutter', 'Kotlin', 'Swift', 'Machine Learning', 'TensorFlow',
  'Figma', 'Photoshop', 'Linux', 'GraphQL', 'Next.js', 'Django',
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Just starting out, learning basics', icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-2 years, built some projects', icon: '📈' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years, production experience', icon: '🏆' },
];

// Validation rules per step
const validateStep = (step, data) => {
  const errors = {};

  if (step === 1) {
    if (!data.full_name || data.full_name.trim().length < 2)
      errors.full_name = 'Full name must be at least 2 characters';
    else if (!/^[A-Za-z\s]+$/.test(data.full_name.trim()))
      errors.full_name = 'Full name must contain only alphabetic characters and spaces';
    if (!data.phone)
      errors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(data.phone))
      errors.phone = 'Phone number must be exactly 10 digits';
    if (!data.country) errors.country = 'Please select a country';
    if (!data.state) errors.state = 'Please select a state';
    if (!data.district) errors.district = 'Please select a district';
    if (!data.taluka) errors.taluka = 'Please select a taluka';
  }

  if (step === 2) {
    if (!data.college || data.college.trim().length < 3)
      errors.college = 'Please enter your college name';
    else if (!/^[A-Za-z\s]+$/.test(data.college.trim()))
      errors.college = 'College name must contain only alphabetic characters and spaces';
    if (!data.branch || data.branch.trim().length < 2)
      errors.branch = 'Please enter your branch';
    else if (!/^[A-Za-z\s]+$/.test(data.branch.trim()))
      errors.branch = 'Branch must contain only alphabetic characters and spaces';
    if (!data.year)
      errors.year = 'Please select your year of study';
  }

  if (step === 3) {
    if (!data.career_goal)
      errors.career_goal = 'Please select your career goal';
    if (data.career_interests.length === 0)
      errors.career_interests = 'Select at least one area of interest';
  }

  if (step === 4) {
    if (!data.experience_level)
      errors.experience_level = 'Please select your experience level';
    if (data.skills.length < 2)
      errors.skills = 'Select at least 2 skills';
  }

  if (step === 5) {
    if (!data.bio || data.bio.trim().length < 20)
      errors.bio = 'Bio must be at least 20 characters';
  }

  return errors;
};

const InputField = ({ label, field, placeholder, type = 'text', required = false, optional = false, data, update, handleBlur, touched, errors }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
      {label} {required && <span className="text-red-400">*</span>} {optional && <span className="text-gray-500 font-normal normal-case">(Optional)</span>}
    </label>
    <input
      type={type}
      value={data[field]}
      onChange={e => update(field, e.target.value)}
      onBlur={() => handleBlur(field)}
      placeholder={placeholder}
      className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
        errors[field] && touched[field]
          ? 'border-red-500/60 focus:ring-red-500/20 focus:border-red-500'
          : 'border-white/10 focus:ring-primary/20 focus:border-primary'
      }`}
    />
    {errors[field] && touched[field] && (
      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
        <span>⚠</span> {errors[field]}
      </p>
    )}
  </div>
);

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [data, setData] = useState({
    full_name: '', phone: '', country: 'India', state: '', district: '', taluka: '',
    college: '', branch: '', year: '',
    career_goal: '', career_interests: [],
    experience_level: '', skills: [],
    bio: '', github_url: '', linkedin_url: '', portfolio_url: ''
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  const update = (field, value) => {
    let val = value;
    if (field === 'phone') {
      val = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    if (['full_name', 'college', 'branch'].includes(field)) {
      val = value.replace(/[^A-Za-z\s]/g, '');
      val = val.replace(/\s{2,}/g, ' '); // Auto-trim multiple spaces
    }
    setData(prev => ({ ...prev, [field]: val }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, ...validateStep(step, { ...data, [field]: val }) }));
    }
  };

  const handleBlur = async (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    let updatedData = { ...data };
    if (field === 'full_name') {
      const trimmed = data.full_name.trim();
      updatedData.full_name = trimmed;
      setData(prev => ({ ...prev, full_name: trimmed }));
    }
    
    setErrors(validateStep(step, updatedData));

    // Async duplicate phone check
    if (field === 'phone' && updatedData.phone.length >= 10) {
      try {
        const res = await api.post('/onboarding/check-phone', { phone: updatedData.phone });
        if (!res.data.available) {
          setErrors(prev => ({ ...prev, phone: res.data.reason }));
        }
      } catch (err) {
        console.error("Phone check error", err);
      }
    }
  };

  const toggleItem = (field, item) => {
    setData(prev => {
      const list = prev[field];
      const updated = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
      return { ...prev, [field]: updated };
    });
  };

  const triggerSuccessAnimation = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2015FF', '#4ade80', '#c084fc']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2015FF', '#4ade80', '#c084fc']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleNext = async () => {
    if (isTransitioning) return;
    const stepErrors = validateStep(step, data);
    
    // Explicit phone check on next for Step 1
    if (step === 1 && !stepErrors.phone && data.phone) {
      try {
        const res = await api.post('/onboarding/check-phone', { phone: data.phone });
        if (!res.data.available) {
          stepErrors.phone = res.data.reason;
        }
      } catch (err) {
        console.error("Phone check error", err);
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const allTouched = {};
      Object.keys(stepErrors).forEach(k => allTouched[k] = true);
      setTouched(t => ({ ...t, ...allTouched }));
      
      gsap.fromTo(cardRef.current,
        { x: -8 },
        { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
      );
      return;
    }

    if (step < STEPS.length) {
      setIsTransitioning(true);
      const tl = gsap.timeline();
      tl.to(contentRef.current, { x: -50, opacity: 0, duration: 0.25, ease: 'power2.in' })
        .call(() => {
          setStep(s => s + 1);
          setTouched({});
          setErrors({});
        })
        .fromTo(contentRef.current, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out', onComplete: () => setIsTransitioning(false) });
    } else {
      setSaving(true);
      try {
        await api.post('/onboarding/save', { ...data, onboarding_completed: true });
        triggerSuccessAnimation();
        
        // Wait a little bit for the user to see the confetti
        setTimeout(() => {
          completeOnboarding();
          navigate('/dashboard');
        }, 1500);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Failed to save profile');
        setSaving(false);
      }
    }
  };
  
  const handleBack = () => {
    if (isTransitioning) return;
    if (step > 1) {
      setIsTransitioning(true);
      const tl = gsap.timeline();
      tl.to(contentRef.current, { x: 50, opacity: 0, duration: 0.25, ease: 'power2.in' })
        .call(() => {
          setStep(s => s - 1);
          setTouched({});
          setErrors({});
        })
        .fromTo(contentRef.current, { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out', onComplete: () => setIsTransitioning(false) });
    }
  };

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-x-hidden overflow-y-auto">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(32,21,255,0.10) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(32,21,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/30">C</div>
          <span className="text-white font-bold text-lg">Codovate</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm hidden sm:block">Setting up your profile</span>
          <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
            <span className="text-white text-xs font-bold">{step}</span>
            <span className="text-gray-500 text-xs">/{STEPS.length}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 h-0.5 bg-white/5">
        <div
          className="h-full bg-primary transition-all duration-700 ease-out shadow-lg shadow-primary/50"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">

        {/* Step Indicators */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                step > s.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : step === s.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white/5 text-gray-600 border border-white/5'
              }`}>
                {step > s.id ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{s.id}</span>
                )}
                <span className="hidden sm:block">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px transition-all duration-500 ${step > s.id ? 'bg-primary/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div ref={cardRef} className="w-full max-w-lg">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 80px rgba(32,21,255,0.06), 0 25px 50px rgba(0,0,0,0.5)' }}>

            {/* Card Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
                  {STEPS[step - 1].icon}
                </div>
                <div>
                  <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-0.5">
                    Step {step} of {STEPS.length}
                  </p>
                  <h2 className="text-xl font-bold text-white">{STEPS[step - 1].title}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{STEPS[step - 1].desc}</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div ref={contentRef} className="px-8 py-6">

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <InputField
                    label="Full Name" field="full_name"
                    placeholder="e.g. Ratikant Patil" required
                    data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors}
                  />
                  <InputField
                    label="Phone Number" field="phone"
                    placeholder="9876543210" type="tel" required
                    data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors}
                  />
                  
                  {/* Location Selectors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={data.country}
                        onChange={(e) => {
                          update('country', e.target.value);
                          setData(prev => ({ ...prev, state: '', district: '', taluka: '' }));
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                      >
                        <option value="" className="bg-[#0a0a0a]">Select Country</option>
                        {Object.keys(locationData).map(c => (
                          <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
                        ))}
                      </select>
                      {errors.country && touched.country && <p className="text-red-400 text-xs mt-1">⚠ {errors.country}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        State <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={data.state}
                        disabled={!data.country}
                        onChange={(e) => {
                          update('state', e.target.value);
                          setData(prev => ({ ...prev, district: '', taluka: '' }));
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 appearance-none"
                      >
                        <option value="" className="bg-[#0a0a0a]">Select State</option>
                        {data.country && locationData[data.country] && Object.keys(locationData[data.country]).map(s => (
                          <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
                        ))}
                      </select>
                      {errors.state && touched.state && <p className="text-red-400 text-xs mt-1">⚠ {errors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        District <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={data.district}
                        disabled={!data.state}
                        onChange={(e) => {
                          update('district', e.target.value);
                          setData(prev => ({ ...prev, taluka: '' }));
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 appearance-none"
                      >
                        <option value="" className="bg-[#0a0a0a]">Select District</option>
                        {data.state && locationData[data.country]?.[data.state] && Object.keys(locationData[data.country][data.state]).map(d => (
                          <option key={d} value={d} className="bg-[#0a0a0a]">{d}</option>
                        ))}
                      </select>
                      {errors.district && touched.district && <p className="text-red-400 text-xs mt-1">⚠ {errors.district}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        Taluka <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={data.taluka}
                        disabled={!data.district}
                        onChange={(e) => update('taluka', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 appearance-none"
                      >
                        <option value="" className="bg-[#0a0a0a]">Select Taluka</option>
                        {data.district && locationData[data.country]?.[data.state]?.[data.district] && locationData[data.country][data.state][data.district].map(t => (
                          <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>
                        ))}
                      </select>
                      {errors.taluka && touched.taluka && <p className="text-red-400 text-xs mt-1">⚠ {errors.taluka}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Academic */}
              {step === 2 && (
                <div className="space-y-4">
                  <InputField
                    label="College / University" field="college"
                    placeholder="e.g. Walchand College of Engineering" required
                    data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors}
                  />
                  <InputField
                    label="Branch / Major" field="branch"
                    placeholder="e.g. Computer Science & Engineering" required
                    data={data} update={update} handleBlur={handleBlur} touched={touched} errors={errors}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Year of Study <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { y: 1, label: '1st Year' },
                        { y: 2, label: '2nd Year' },
                        { y: 3, label: '3rd Year' },
                        { y: 4, label: '4th Year' },
                      ].map(({ y, label }) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => update('year', y)}
                          className={`py-3 rounded-xl text-xs font-bold border transition-all duration-200 ${
                            data.year === y
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-primary/40 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {errors.year && touched.year && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠</span> {errors.year}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Career Goal */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Career Goal <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CAREER_GOALS.map(goal => (
                        <button
                          key={goal.value}
                          type="button"
                          onClick={() => update('career_goal', goal.value)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                            data.career_goal === goal.value
                              ? 'bg-primary/15 border-primary text-white'
                              : 'bg-white/5 border-white/8 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{goal.icon}</span>
                          <span className="font-semibold text-xs">{goal.label}</span>
                          {data.career_goal === goal.value && (
                            <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.career_goal && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <span>⚠</span> {errors.career_goal}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Areas of Interest <span className="text-red-400">*</span>
                      <span className="text-gray-600 normal-case tracking-normal ml-1">({data.career_interests.length} selected)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleItem('career_interests', interest)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            data.career_interests.includes(interest)
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                    {errors.career_interests && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <span>⚠</span> {errors.career_interests}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Skills */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Experience Level <span className="text-red-400">*</span>
                    </label>
                    <div className="space-y-2">
                      {EXPERIENCE_LEVELS.map(level => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => update('experience_level', level.value)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                            data.experience_level === level.value
                              ? 'bg-primary/10 border-primary'
                              : 'bg-white/5 border-white/8 hover:border-white/20'
                          }`}
                        >
                          <span className="text-2xl">{level.icon}</span>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${data.experience_level === level.value ? 'text-white' : 'text-gray-300'}`}>
                              {level.label}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{level.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            data.experience_level === level.value
                              ? 'border-primary bg-primary'
                              : 'border-gray-600'
                          }`}>
                            {data.experience_level === level.value && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.experience_level && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <span>⚠</span> {errors.experience_level}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Your Skills <span className="text-red-400">*</span>
                      <span className="text-gray-600 normal-case tracking-normal ml-1">
                        (min 2, {data.skills.length} selected)
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                      {ALL_SKILLS.map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleItem('skills', skill)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            data.skills.includes(skill)
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                    {errors.skills && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <span>⚠</span> {errors.skills}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Portfolio */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Bio / About You <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={data.bio}
                      onChange={e => update('bio', e.target.value)}
                      onBlur={() => handleBlur('bio')}
                      placeholder="Write a short professional bio. Tell recruiters who you are, what you build, and what you're looking for..."
                      rows={4}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                        errors.bio && touched.bio
                          ? 'border-red-500/60 focus:ring-red-500/20'
                          : 'border-white/10 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.bio && touched.bio ? (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <span>⚠</span> {errors.bio}
                        </p>
                      ) : <span />}
                      <span className={`text-xs ${data.bio.length < 20 ? 'text-gray-600' : 'text-green-400'}`}>
                        {data.bio.length}/20 min
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      GitHub <span className="text-gray-500 font-normal normal-case">(Optional)</span>
                    </label>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <span className="px-3 py-3.5 text-gray-500 text-sm border-r border-white/10 bg-white/3 shrink-0">
                        github.com/
                      </span>
                      <input
                        value={data.github_url}
                        onChange={e => update('github_url', e.target.value)}
                        placeholder="yourusername"
                        className="flex-1 bg-transparent px-3 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      LinkedIn <span className="text-gray-500 font-normal normal-case">(Optional)</span>
                    </label>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <span className="px-3 py-3.5 text-gray-500 text-sm border-r border-white/10 bg-white/3 shrink-0">
                        linkedin.com/in/
                      </span>
                      <input
                        value={data.linkedin_url}
                        onChange={e => update('linkedin_url', e.target.value)}
                        placeholder="yourusername"
                        className="flex-1 bg-transparent px-3 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Portfolio Website <span className="text-gray-500 font-normal normal-case">(Optional)</span>
                    </label>
                    <input
                      value={data.portfolio_url}
                      onChange={e => update('portfolio_url', e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
              <button
                onClick={handleBack}
                disabled={step === 1 || isTransitioning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                ← Back
              </button>

              <div className="flex items-center gap-3">
                {/* Step dots */}
                <div className="hidden sm:flex items-center gap-1">
                  {STEPS.map(s => (
                    <div key={s.id} className={`rounded-full transition-all duration-300 ${
                      s.id === step ? 'w-4 h-1.5 bg-primary' :
                      s.id < step ? 'w-1.5 h-1.5 bg-primary/40' :
                      'w-1.5 h-1.5 bg-white/10'
                    }`} />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={saving || isTransitioning}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-7 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : step === STEPS.length ? (
                    <>Complete Setup ✨</>
                  ) : (
                    <>Continue →</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-gray-600 text-xs mt-4">
            Your data is secure and only used to match you with opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}