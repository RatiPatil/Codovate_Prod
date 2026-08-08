import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const MentorsSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.mentors-banner', {
        scale: 0.96,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="mentors" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mentors-banner p-8 sm:p-12 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Expert Practitioner Network</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Learn from Experienced Industry Practitioners.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                1-on-1 Mentorship.
              </span>
            </h2>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Get direct code reviews, resume feedback, and mock interview guidance from engineers who have navigated the hiring process at scale.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Live 1-on-1 Code Review Sessions</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Mock Technical Interview Practice</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Actionable Resume & Portfolio Critiques</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Personalized Career Roadmaps</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-indigo-50/70 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800 space-y-4 text-center lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto lg:mx-0 shadow-md">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">Connect with Mentors Today</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Schedule personalized guidance sessions aligned with your target software roles.
              </p>
            </div>

            <Link
              to="/mentors"
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              Browse Mentor Network
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MentorsSection;
