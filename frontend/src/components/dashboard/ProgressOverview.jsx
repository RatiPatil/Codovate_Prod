import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

const ProgressOverview = ({ profile }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.3 }
      );
    }
  }, []);

  const cards = [
    {
      title: 'Profile Completion',
      value: profile.profile_completion,
      link: '/profile',
      color: 'bg-blue-500',
      emptyText: 'Complete your profile details.',
      icon: '👤'
    },
    {
      title: 'Resume Score',
      value: profile.resume_score,
      link: '/profile',
      color: 'bg-purple-500',
      emptyText: 'Upload your resume to receive an ATS score.',
      icon: '📄'
    },
    {
      title: 'Roadmap Progress',
      value: profile.roadmap_progress,
      link: '/roadmap',
      color: 'bg-yellow-500',
      emptyText: 'Start your learning roadmap.',
      icon: '🗺️'
    },
    {
      title: 'Learning Progress',
      value: profile.learning_progress,
      link: '/roadmap',
      color: 'bg-green-500',
      emptyText: 'Complete a learning module.',
      icon: '🧠'
    }
  ];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Progress Overview</h2>
        <p className="text-gray-400 text-sm mt-1">Track your growth across all dimensions.</p>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <Link 
            key={idx}
            to={card.link}
            className="group block bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 hover:bg-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden"
          >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-sm font-bold text-gray-300">{card.title}</h3>
              </div>

              {card.value > 0 ? (
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-black text-white">{card.value}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${card.color} rounded-full`} 
                      style={{ width: `${card.value}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {card.emptyText}
                  </p>
                  <span className="inline-block mt-3 text-xs font-bold text-primary group-hover:text-primary-light transition-colors">
                    Take Action →
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProgressOverview;
