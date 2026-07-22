import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/uiUtils';

import {
  Step1Welcome, Step2BasicInfo, Step3CareerVision, Step4DreamCompany,
  Step5Skills, Step6Interests, Step7Learning,
  Step8Experience, LiveProfilePreview
} from '../components/onboarding/OnboardingSteps';
import { Step10AIGeneration, Step11Success } from '../components/onboarding/OnboardingAdvancedSteps';

const TOTAL_STEPS = 8; // Steps 1-8 are form steps, 9 is processing, 10 is success

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [data, setData] = useState({
    full_name: '', college: '', degree: '', branch: '', year: '', city: '', state: '', country: 'India', profile_photo: null,
    career_goal: '', dream_company: '', placement_goal: '',
    skills: [], // array of { name, level }
    interests: [],
    learning_style: '', daily_time: '',
    experience_level: '', projects_built: '',
    github_url: '', linkedin_url: '', portfolio_url: '', resume_url: '', leetcode_url: '', codechef_url: '', hackerrank_url: '',
    phone: '' // added to prevent old validation errors if requested
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  const [toastMessage, setToastMessage] = useState(null);
  const shownToasts = useRef(new Set());
  const toastRef = useRef(null);

  // Load saved state
  useEffect(() => {
    const saved = localStorage.getItem('codovate_onboarding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
        if (parsed.step && parsed.step > 1 && parsed.step <= TOTAL_STEPS) setStep(parsed.step);
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  // Auto save
  useEffect(() => {
    if (isLoaded && step > 1 && step <= TOTAL_STEPS) {
      localStorage.setItem('codovate_onboarding', JSON.stringify({ data, step }));
    } else if (step > TOTAL_STEPS) {
      localStorage.removeItem('codovate_onboarding');
    }
  }, [data, step, isLoaded]);

  // Toast Trigger logic
  useEffect(() => {
    const showToast = (msg) => {
      if (shownToasts.current.has(msg)) return;
      shownToasts.current.add(msg);
      setToastMessage(msg);
    };

    if (data.skills.some(s => s.name?.toLowerCase() === 'java' || s === 'Java')) showToast('☕ Java Lover detected!');
    if (data.career_goal === 'AI Engineer') showToast('🤖 Future AI Engineer loading...');
    if (data.career_goal === 'Startup Founder') showToast('🚀 Future Unicorn Founder?');
    if (step === Math.floor(TOTAL_STEPS / 2)) showToast('Halfway there 🎉');
    if (step === TOTAL_STEPS) showToast('Amazing! Your career journey starts now.');
  }, [data, step]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (toastMessage && toastRef.current) {
        gsap.killTweensOf(toastRef.current);
        gsap.fromTo(toastRef.current, { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' });
        gsap.to(toastRef.current, { y: 50, opacity: 0, scale: 0.9, duration: 0.5, delay: 3, onComplete: () => setToastMessage(null) });
      }
    }, toastRef);
    return () => ctx.revert();
  }, [toastMessage]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (step > 1 && step <= TOTAL_STEPS && cardRef.current) {
        gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
      }
    }, cardRef);
    return () => ctx.revert();
  }, [step]);

  const update = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    validateField(field, data[field]);
  };

  const validateField = (field, value) => {
    let newErrors = { ...errors };
    if (field === 'full_name' && (!value || value.trim().length < 3)) newErrors.full_name = 'Name must be at least 3 characters';
    else if (field === 'full_name') delete newErrors.full_name;
    
    if (['college', 'degree', 'branch', 'city', 'state', 'country'].includes(field)) {
      if (!value || value.trim().length < 2) newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      else delete newErrors[field];
    }
    
    if (field === 'year' && !value) newErrors.year = 'Year is required';
    else if (field === 'year') delete newErrors.year;

    setErrors(newErrors);
  };

  const validateStep = (currentStep) => {
    let stepErrors = {};
    if (currentStep === 2) {
      if (!data.full_name || data.full_name.trim().length < 3) stepErrors.full_name = 'Name must be at least 3 characters';
      if (!data.college) stepErrors.college = 'College is required';
      if (!data.degree) stepErrors.degree = 'Degree is required';
      if (!data.branch) stepErrors.branch = 'Branch is required';
      if (!data.year) stepErrors.year = 'Year is required';
      if (!data.city) stepErrors.city = 'City is required';
      if (!data.state) stepErrors.state = 'State is required';
      if (!data.country) stepErrors.country = 'Country is required';
    } else if (currentStep === 3) {
      if (!data.career_goal) { showAlert("Please select a career goal"); return false; }
    } else if (currentStep === 5) {
      if (!data.skills || data.skills.length === 0) { showAlert("Please select at least one skill"); return false; }
    } else if (currentStep === 8) {
      if (!data.experience_level) { showAlert("Please select your experience level"); return false; }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = async () => {
    if (isTransitioning) return;
    
    // Validate current step
    if (!validateStep(step)) {
      const allTouched = {};
      Object.keys(data).forEach(k => allTouched[k] = true);
      setTouched(allTouched);
      if (cardRef.current) gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
      return;
    }

    if (step < TOTAL_STEPS + 2) {
      setIsTransitioning(true);
      if (contentRef.current && step > 1 && step <= TOTAL_STEPS) {
        const tl = gsap.timeline();
        tl.to(contentRef.current, { x: -30, opacity: 0, duration: 0.2, ease: 'power2.in' })
          .call(() => {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
          })
          .fromTo(contentRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: () => setIsTransitioning(false) });
      } else {
        setStep(s => s + 1);
        setIsTransitioning(false);
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    if (isTransitioning || step <= 1 || step > TOTAL_STEPS) return;
    setIsTransitioning(true);
    if (contentRef.current) {
      const tl = gsap.timeline();
      tl.to(contentRef.current, { x: 30, opacity: 0, duration: 0.2, ease: 'power2.in' })
        .call(() => {
          setStep(s => s - 1);
          window.scrollTo(0, 0);
        })
        .fromTo(contentRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: () => setIsTransitioning(false) });
    }
  };

  const submitProfile = async () => {
    setSaving(true);
    try {
      await api.post('/onboarding/save', { ...data, onboarding_completed: true });
      // Proceed to success screen
      setStep(TOTAL_STEPS + 2);
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Failed to save profile');
      // Fallback: stay on step 9 or go to dashboard
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const finishOnboarding = () => {
    completeOnboarding();
    navigate('/dashboard');
  };

  // Render logic
  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-x-hidden overflow-y-auto">
      {/* Background with CSS Animation */}
      <style>{`
        @keyframes slowGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg {
          background: linear-gradient(-45deg, rgba(32,21,255,0.05), rgba(10,10,30,0.8), rgba(0,0,0,1), rgba(32,21,255,0.08));
          background-size: 400% 400%;
          animation: slowGradient 20s ease infinite;
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none animated-bg" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

      {/* Top Bar for Steps 2-8 */}
      {step > 1 && step <= TOTAL_STEPS && (
        <div className="relative z-20 px-6 py-5 border-b border-white/5 bg-black/40 backdrop-blur-xl flex flex-col items-center shadow-lg">
          <div className="w-full max-w-5xl flex items-center justify-between mb-6">
             <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium hidden sm:block">Back</span>
             </button>
             <span className="text-white font-bold text-xl tracking-wider">Codovate</span>
             <div className="w-16" /> {/* Placeholder for flex balance */}
          </div>
          
          {/* Text-based Progress Bar */}
          <div className="w-full max-w-2xl flex flex-col items-center justify-center relative px-2 gap-3 mt-2">
            <h3 className="text-white font-semibold text-sm">🚀 Building Your Career Workspace</h3>
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(32,21,255,0.8)]" style={{ width: `${Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}%` }} />
              </div>
              <span className="text-primary font-bold text-xs">{Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}% Completed</span>
            </div>
            
            {/* Checklist */}
            <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500 mt-2">
              <span className={`transition-colors duration-300 ${step > 3 ? 'text-green-400 font-medium' : 'opacity-50'}`}>
                ✔ Career Goal
              </span>
              <span className={`transition-colors duration-300 ${step > 5 ? 'text-green-400 font-medium' : 'opacity-50'}`}>
                ✔ Skills
              </span>
              <span className={`transition-colors duration-300 ${step > 6 ? 'text-green-400 font-medium' : 'opacity-50'}`}>
                ✔ Interests
              </span>
              <span className="animate-pulse text-primary font-medium opacity-80">⏳ Preparing Dashboard</span>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-6xl mx-auto">
        
        {step === 1 && <Step1Welcome onNext={handleNext} />}
        
        {step > 1 && step <= TOTAL_STEPS && (
          <div className="flex w-full gap-8 justify-center items-start">
            <div ref={cardRef} className="w-full max-w-xl shrink-0">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden glass-panel" style={{ boxShadow: '0 0 80px rgba(32,21,255,0.06), 0 25px 50px rgba(0,0,0,0.5)' }}>
              <div ref={contentRef} className="px-8 py-8">
                {step === 2 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>
                    <Step2BasicInfo data={data} update={update} touched={touched} handleBlur={handleBlur} errors={errors} />
                  </>
                )}
                {step === 3 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Career Vision</h2>
                    <Step3CareerVision data={data} update={update} />
                  </>
                )}
                {step === 4 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Dream Company</h2>
                    <Step4DreamCompany data={data} update={update} /> 
                  </>
                )}
                {step === 5 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Current Skills</h2>
                    <Step5Skills data={data} update={update} />
                  </>
                )}
                {step === 6 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Interests</h2>
                    <Step6Interests data={data} update={update} />
                  </>
                )}
                {step === 7 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Learning Preferences</h2>
                    <Step7Learning data={data} update={update} />
                  </>
                )}
                {step === 8 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Projects & Experience</h2>
                    <Step8Experience data={data} update={update} />
                  </>
                )}
                
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <button onClick={handleNext} disabled={isTransitioning} className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 flex items-center gap-2">
                    {step === TOTAL_STEPS ? 'Generate Workspace' : 'Continue'}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            </div>
            
            {/* Live Profile Preview - Hidden on small screens */}
            {step > 1 && step <= TOTAL_STEPS && (
              <div className="hidden lg:block w-full max-w-sm sticky top-8">
                <LiveProfilePreview data={data} step={step} totalSteps={TOTAL_STEPS} />
              </div>
            )}
          </div>
        )}

        {step === TOTAL_STEPS + 1 && <Step10AIGeneration onComplete={submitProfile} />}
        {step === TOTAL_STEPS + 2 && <Step11Success data={data} onFinish={finishOnboarding} />}

      </div>

      {/* GSAP Toaster */}
      <div 
        ref={toastRef} 
        className="fixed bottom-8 right-8 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-[0_10px_40px_rgba(32,21,255,0.3)] pointer-events-none"
        style={{ opacity: 0, transform: 'translateY(50px) scale(0.9)' }}
      >
        <span className="text-white font-bold text-sm tracking-wide">{toastMessage}</span>
      </div>
    </div>
  );
}