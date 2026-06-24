import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: '👤', desc: 'Tell us about yourself' },
  { id: 2, title: 'Academic', icon: '🎓', desc: 'Your education details' },
  { id: 3, title: 'Career Goal', icon: '🎯', desc: 'What you want to achieve' },
  { id: 4, title: 'Skills', icon: '⚡', desc: 'What you are good at' },
  { id: 5, title: 'Portfolio', icon: '🔗', desc: 'Show your work' },
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
  'Figma', 'Photoshop', 'Linux', 'GraphQL', 'Next.js',
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Just starting out', icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-2 years of learning', icon: '📈' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years experience', icon: '🏆' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    full_name: '', phone: '', city: '',
    college: '', branch: '', year: '',
    career_goal: '', career_interests: [], experience_level: '',
    skills: [],
    portfolio_url: '', github_url: '', linkedin_url: '', bio: '',
  });

  const { completeOnboarding, user } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    if (user?.name) setData(d => ({ ...d, full_name: d.full_name || user.name }));
  }, [user]);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [step]);

  const toggleItem = (key, value) => {
    setData(d => ({
      ...d,
      [key]: d[key].includes(value)
        ? d[key].filter(i => i !== value)
        : [...d[key], value]
    }));
  };

  const saveStep = async (isLast = false) => {
    setSaving(true);
    try {
      const finalCompletion = isLast ? 100 : Math.round((step / STEPS.length) * 100);
      await api.post('/onboarding/save', {
        ...data,
        skills: data.skills,
        career_interests: data.career_interests,
        profile_completion: finalCompletion,
        onboarding_completed: isLast,
      });
      if (isLast) {
        completeOnboarding();
        navigate('/dashboard');
      } else {
        setStep(s => s + 1);
      }
    } catch (err) {
      console.error('Onboarding save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(32,21,255,0.12) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(32,21,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/30">C</div>
          <span className="text-white font-bold text-lg">Codovate</span>
        </div>
        <div className="text-gray-500 text-sm">
          Step <span className="text-white font-semibold">{step}</span> of {STEPS.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 h-1 bg-white/5">
        <div
          className="h-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Step Indicators */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step > s.id
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : step === s.id
                  ? 'bg-primary text-white ring-4 ring-primary/20'
                  : 'bg-white/5 text-gray-600 border border-white/10'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 md:w-12 h-px transition-all duration-500 ${step > s.id ? 'bg-primary' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div ref={cardRef} className="w-full max-w-lg">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8"
            style={{ boxShadow: '0 0 60px rgba(32,21,255,0.08)' }}>

            {/* Step Header */}
            <div className="mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mb-4">
                {STEPS[step - 1].icon}
              </div>
              <h2 className="text-2xl font-bold text-white">{STEPS[step - 1].title}</h2>
              <p className="text-gray-400 text-sm mt-1">{STEPS[step - 1].desc}</p>
            </div>

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Full Name *</label>
                  <input
                    value={data.full_name}
                    onChange={e => setData({ ...data, full_name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Phone Number</label>
                  <input
                    value={data.phone}
                    onChange={e => setData({ ...data, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">City</label>
                  <input
                    value={data.city}
                    onChange={e => setData({ ...data, city: e.target.value })}
                    placeholder="e.g. Mumbai, Pune, Delhi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Academic */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">College / University *</label>
                  <input
                    value={data.college}
                    onChange={e => setData({ ...data, college: e.target.value })}
                    placeholder="e.g. IIT Bombay, VIT, BITS Pilani"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Branch / Major *</label>
                  <input
                    value={data.branch}
                    onChange={e => setData({ ...data, branch: e.target.value })}
                    placeholder="e.g. Computer Science, IT, ECE"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Year of Study *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setData({ ...data, year: y })}
                        className={`py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                          data.year === y
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        Year {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Career Goal */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-gray-400 mb-3 font-medium">What is your career goal? *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CAREER_GOALS.map(goal => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setData({ ...data, career_goal: goal.value })}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition-all duration-200 ${
                          data.career_goal === goal.value
                            ? 'bg-primary/15 border-primary text-white shadow-md shadow-primary/10'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{goal.icon}</span>
                        <span className="font-medium text-xs leading-tight">{goal.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-3 font-medium">Areas of interest</label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleItem('career_interests', interest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                          data.career_interests.includes(interest)
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Skills */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-gray-400 mb-3 font-medium">Experience Level *</label>
                  <div className="space-y-2">
                    {EXPERIENCE_LEVELS.map(level => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setData({ ...data, experience_level: level.value })}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                          data.experience_level === level.value
                            ? 'bg-primary/15 border-primary shadow-md shadow-primary/10'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{level.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${data.experience_level === level.value ? 'text-white' : 'text-gray-300'}`}>
                            {level.label}
                          </p>
                          <p className="text-gray-500 text-xs">{level.desc}</p>
                        </div>
                        {data.experience_level === level.value && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-3 font-medium">
                    Your Skills <span className="text-gray-600">({data.skills.length} selected)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {ALL_SKILLS.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleItem('skills', skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                          data.skills.includes(skill)
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Portfolio */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Bio / About You</label>
                  <textarea
                    value={data.bio}
                    onChange={e => setData({ ...data, bio: e.target.value })}
                    placeholder="Tell recruiters about yourself in 2-3 lines..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">GitHub Profile</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">github.com/</span>
                    <input
                      value={data.github_url}
                      onChange={e => setData({ ...data, github_url: e.target.value })}
                      placeholder="yourusername"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-24 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">LinkedIn Profile</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">linkedin.com/in/</span>
                    <input
                      value={data.linkedin_url}
                      onChange={e => setData({ ...data, linkedin_url: e.target.value })}
                      placeholder="yourusername"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-36 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Portfolio Website</label>
                  <input
                    value={data.portfolio_url}
                    onChange={e => setData({ ...data, portfolio_url: e.target.value })}
                    placeholder="https://yourportfolio.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
              <button
                onClick={() => step > 1 && setStep(s => s - 1)}
                disabled={step === 1}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>

              <button
                onClick={() => saveStep(step === STEPS.length)}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-7 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : step === STEPS.length ? '✨ Complete Setup' : 'Continue →'}
              </button>
            </div>
          </div>

          {step < STEPS.length && (
            <p className="text-center mt-4">
              <button
                onClick={() => setStep(s => s + 1)}
                className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
              >
                Skip this step →
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}