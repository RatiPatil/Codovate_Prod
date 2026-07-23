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
        tl.to(contentRef.current, { scale: 0.95, opacity: 0, filter: 'blur(8px)', duration: 0.3, ease: 'power2.inOut' })
          .call(() => {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
          })
          .fromTo(contentRef.current, { y: 40, scale: 1.05, opacity: 0, filter: 'blur(10px)' }, { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', onComplete: () => setIsTransitioning(false) });
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
      tl.to(contentRef.current, { scale: 0.95, y: 40, opacity: 0, filter: 'blur(8px)', duration: 0.3, ease: 'power2.inOut' })
        .call(() => {
          setStep(s => s - 1);
          window.scrollTo(0, 0);
        })
        .fromTo(contentRef.current, { scale: 1.05, opacity: 0, filter: 'blur(10px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', onComplete: () => setIsTransitioning(false) });
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-x-hidden overflow-y-auto selection:bg-primary/30 selection:text-white font-inter">
      {/* Premium Animated Background */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .mesh-bg {
          background: radial-gradient(circle at 15% 50%, rgba(32, 21, 255, 0.08), transparent 25%),
                      radial-gradient(circle at 85% 30%, rgba(138, 43, 226, 0.05), transparent 25%);
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }
        .blob-1 { animation: floatBlob 20s ease-in-out infinite; }
        .blob-2 { animation: floatBlob 25s ease-in-out infinite reverse; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none mesh-bg z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] blob-1 z-0 pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[150px] blob-2 z-0 pointer-events-none mix-blend-screen" />

      {/* Top Bar for Steps 2-8 */}
      {step > 1 && step <= TOTAL_STEPS && (
        <div className="relative z-20 px-6 py-6 flex flex-col items-center">
          <div className="w-full max-w-6xl flex items-center justify-between mb-8">
             <button onClick={handleBack} className="text-gray-400 hover:text-white transition-all flex items-center gap-2 group px-4 py-2 rounded-full hover:bg-white/5">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-semibold hidden sm:block">Back</span>
             </button>
             
             {/* Progress Journey Indicator */}
             <div className="hidden md:flex items-center gap-2">
               {['Basic Info', 'Vision', 'Company', 'Skills', 'Interests', 'Learning', 'Experience'].map((label, idx) => {
                 const stepNum = idx + 2;
                 const isActive = step === stepNum;
                 const isCompleted = step > stepNum;
                 return (
                   <React.Fragment key={idx}>
                     <div className="flex flex-col items-center gap-1 group relative">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${isActive ? 'bg-primary text-white shadow-[0_0_15px_rgba(32,21,255,0.5)] scale-110' : isCompleted ? 'bg-white/10 text-gray-300' : 'bg-transparent border border-white/10 text-gray-600'}`}>
                         {isCompleted ? '✓' : stepNum - 1}
                       </div>
                       <span className={`absolute -bottom-5 whitespace-nowrap text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-600'} opacity-0 group-hover:opacity-100`}>{label}</span>
                     </div>
                     {idx < 6 && (
                       <div className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-primary/50' : 'bg-white/5'}`} />
                     )}
                   </React.Fragment>
                 );
               })}
             </div>

             <div className="w-24 text-right">
               <span className="text-gray-500 text-xs font-semibold tracking-widest uppercase">Codovate</span>
             </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-6xl mx-auto">
        
        {step === 1 && <Step1Welcome onNext={handleNext} />}
        
        {step > 1 && step <= TOTAL_STEPS && (
          <div className="flex w-full gap-10 justify-center items-start">
            <div ref={cardRef} className="w-full max-w-xl shrink-0">
            <div className="glass-panel rounded-3xl overflow-hidden relative">
              {/* Subtle inner top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <div ref={contentRef} className="px-8 py-10 sm:px-12 sm:py-12">
                {step === 2 && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Let's get to know you</h2>
                    <p className="text-gray-400 mb-8 text-sm">Every great journey begins with a name.</p>
                    <Step2BasicInfo data={data} update={update} touched={touched} handleBlur={handleBlur} errors={errors} />
                  </>
                )}
                {step === 3 && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Set your destination</h2>
                    <p className="text-gray-400 mb-8 text-sm">Where do you want this journey to take you? 🚀</p>
                    <Step3CareerVision data={data} update={update} />
                  </>
                )}
                {step === 4 && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Your Dream Company</h2>
                    <p className="text-gray-400 mb-8 text-sm">Aim high. We'll help you get there.</p>
                    <Step4DreamCompany data={data} update={update} /> 
                  </>
                )}
                {step === 5 && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Your Superpowers</h2>
                    <p className="text-gray-400 mb-8 text-sm">Every hero has tools. Select your tech stack ⚡</p>
                    <Step5Skills data={data} update={update} />
                  </>
                )}
                {step === 6 && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">What excites you?</h2>
                    <p className="text-gray-400 mb-8 text-sm">Pick the domains you want to conquer.</p>
                    <Step6Interests data={data} update={update} />
                  </>
                )}
                {step === 7 && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Learning DNA</h2>
                    <p className="text-gray-400 mb-8 text-sm">How do you prefer to level up?</p>
                    <Step7Learning data={data} update={update} />
                  </>
                )}
                {step === 8 && (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Your Legacy</h2>
                    <p className="text-gray-400 mb-8 text-sm">Everyone starts somewhere. Be honest 😊</p>
                    <Step8Experience data={data} update={update} />
                  </>
                )}
                
                <div className="mt-10 pt-8 border-t border-white/5 flex justify-end">
                  <button onClick={handleNext} disabled={isTransitioning} className="bg-white text-black hover:bg-gray-200 font-bold py-3.5 px-8 rounded-full transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_25px_rgba(255,255,255,0.2)] hover:scale-105 flex items-center gap-2 group">
                    {step === TOTAL_STEPS ? 'Generate Workspace' : 'Continue'}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
        className="fixed bottom-8 right-8 z-50 glass-panel rounded-full px-6 py-4 pointer-events-none flex items-center gap-3"
        style={{ opacity: 0, transform: 'translateY(50px) scale(0.9)' }}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">✨</div>
        <span className="text-white font-semibold text-sm tracking-wide">{toastMessage}</span>
      </div>
    </div>
  );
}