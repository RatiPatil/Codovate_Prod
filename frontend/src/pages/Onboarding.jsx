import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/uiUtils';

import {
  Step1Welcome, Step2BasicInfo, Step3CareerVision,
  Step4Skills, Step5Interests, Step6Learning,
  Step7Experience, Step8Links
} from '../components/onboarding/OnboardingSteps';
import { Step9AIGeneration, Step10Success } from '../components/onboarding/OnboardingAdvancedSteps';

const TOTAL_STEPS = 8; // Steps 1-8 are form steps, 9 is processing, 10 is success

export default function Onboarding() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [data, setData] = useState({
    full_name: '', college: '', course: '', branch: '', year: '', city: '', state: '', country: 'India', profile_photo: null,
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

  useEffect(() => {
    if (step > 1 && step <= TOTAL_STEPS && cardRef.current) {
      gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
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
    
    if (['college', 'course', 'branch', 'city', 'state', 'country'].includes(field)) {
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
      if (!data.course) stepErrors.course = 'Course is required';
      if (!data.branch) stepErrors.branch = 'Branch is required';
      if (!data.year) stepErrors.year = 'Year is required';
      if (!data.city) stepErrors.city = 'City is required';
      if (!data.state) stepErrors.state = 'State is required';
      if (!data.country) stepErrors.country = 'Country is required';
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

    if (step < 10) {
      setIsTransitioning(true);
      if (contentRef.current && step > 1 && step < 9) {
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
    if (isTransitioning || step <= 1 || step >= 9) return;
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
      setStep(10);
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
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(32,21,255,0.10) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{ backgroundImage: `linear-gradient(rgba(32,21,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,255,0.8) 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />

      {/* Top Bar for Steps 2-8 */}
      {step > 1 && step <= TOTAL_STEPS && (
        <>
          <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <span className="text-white font-bold text-lg hidden sm:block">Codovate</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm hidden sm:block">AI Career Setup</span>
              <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <span className="text-white text-xs font-bold">{step - 1}</span>
                <span className="text-gray-500 text-xs">/{TOTAL_STEPS - 1}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 h-0.5 bg-white/5">
            <div className="h-full bg-primary transition-all duration-700 ease-out shadow-lg shadow-primary/50" style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }} />
          </div>
        </>
      )}

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {step === 1 && <Step1Welcome onNext={handleNext} />}
        
        {step > 1 && step <= TOTAL_STEPS && (
          <div ref={cardRef} className="w-full max-w-xl">
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
                    <h2 className="text-2xl font-bold text-white mb-6">Current Skills</h2>
                    <Step4Skills data={data} update={update} />
                  </>
                )}
                {step === 5 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Interests</h2>
                    <Step5Interests data={data} update={update} />
                  </>
                )}
                {step === 6 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Learning Preferences</h2>
                    <Step6Learning data={data} update={update} />
                  </>
                )}
                {step === 7 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Experience</h2>
                    <Step7Experience data={data} update={update} />
                  </>
                )}
                {step === 8 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-6">Professional Links</h2>
                    <Step8Links data={data} update={update} />
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
        )}

        {step === 9 && <Step9AIGeneration onComplete={submitProfile} />}
        {step === 10 && <Step10Success data={data} onFinish={finishOnboarding} />}

      </div>
    </div>
  );
}