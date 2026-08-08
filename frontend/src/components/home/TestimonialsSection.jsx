import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageSquare, Star, Quote } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const TestimonialsSection = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  const testimonials = [
    {
      name: 'Rohan D.',
      role: 'Computer Science Student',
      quote:
        'Codovate’s AI Career Roadmap keeps me accountable every single day. The automated code evaluation gives me confidence in solving complex algorithms.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      tag: 'Verified Learner',
      rating: 5,
    },
    {
      name: 'Ananya R.',
      role: 'Full-Stack Developer Learner',
      quote:
        'The Project Hub is game-changing! Building real-time applications with team workspace tools allowed me to create a portfolio I am proud of.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      tag: 'Verified Learner',
      rating: 5,
    },
    {
      name: 'Vikram R.',
      role: 'Software Engineering Aspirant',
      quote:
        'I mastered Graph and Dynamic Programming patterns through Codovate’s visual breakdown and interactive coding environment.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      tag: 'Verified Learner',
      rating: 5,
    },
    {
      name: 'Sneha K.',
      role: 'Backend Engineering Student',
      quote:
        'The ATS resume review tool gave me actionable feedback to format my projects effectively and highlight my technical skills.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      tag: 'Verified Learner',
      rating: 5,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Horizontal subtle track scroll movement
      gsap.to(trackRef.current, {
        x: '-20%',
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Learner Experience</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            What Our Learners Say.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Real Impact.
            </span>
          </h2>
          <p className="text-slate-600 text-base">
            Ambitious engineering students using Codovate to structure their learning, build projects, and prepare for tech careers.
          </p>
        </div>

        {/* Scroll-Linked Horizontal Cards Track */}
        <div className="relative overflow-x-auto pb-6 pt-2 scrollbar-none">
          <div
            ref={trackRef}
            className="flex gap-6 w-max px-4 transition-transform duration-300 ease-out"
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="w-[320px] sm:w-[380px] p-7 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(t.rating)].map((_, r) => (
                        <Star key={r} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <Quote className="w-6 h-6 text-indigo-200" />
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3.5">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                    <p className="text-xs font-semibold text-indigo-600">{t.role}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{t.tag}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
