import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Award, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const MentorsSection = () => {
  const sectionRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left image enters from left (-60px -> 0)
      gsap.from(leftColRef.current, {
        x: -60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });

      // Right text enters from right (60px -> 0)
      gsap.from(rightColRef.current, {
        x: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="mentors" ref={sectionRef} className="py-24 md:py-32 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Mentor Visual Showcase */}
          <div ref={leftColRef} className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative card frame */}
              <div className="relative rounded-3xl overflow-hidden border border-indigo-100 shadow-2xl bg-white p-3">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"
                  alt="Codovate Engineering Mentors"
                  className="w-full h-[380px] sm:h-[440px] object-cover rounded-2xl"
                />

                {/* Floating Mentor Badge Card */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      1:1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Live Office Hours</h4>
                      <p className="text-[11px] text-slate-500">Weekly Code & Architecture Reviews</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                    Active Session
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Mentor Details & Achievements */}
          <div ref={rightColRef} className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>World-Class Guidance</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Meet Your Mentors.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600">
                Learn from the Best.
              </span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Our mentor network consists of Staff Engineers, Tech Leads, and Engineering Managers from Amazon, Google, Meta, Microsoft, and top high-growth startups.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Direct Code Code Reviews</h4>
                  <p className="text-xs text-slate-500">Get granular feedback on PRs, clean code principles, and design patterns.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Career Referral Pathway</h4>
                  <p className="text-xs text-slate-500">Top assessment performers receive direct internal job referrals from verified mentors.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Personalized Placement Strategy</h4>
                  <p className="text-xs text-slate-500">Tailored resume review, mock interviews, and salary negotiation tactics.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/mentors"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow transition-all"
              >
                <span>View Full Mentor Directory</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MentorsSection;
