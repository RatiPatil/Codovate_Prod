import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

const ProfileCard = ({ profile }) => {
  const score = profile?.profile_completion || 82;
  const items = [
    { name: 'GitHub', complete: true },
    { name: 'Projects', complete: true },
    { name: 'Certificates', complete: true },
    { name: 'Portfolio', complete: false },
    { name: 'LinkedIn', complete: true },
    { name: 'Resume', complete: false },
  ];

  const ringRef = useRef(null);

  useEffect(() => {
    // Circle animation
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    gsap.fromTo(ringRef.current,
      { strokeDashoffset: circumference },
      { strokeDashoffset: offset, duration: 2, ease: 'power3.out' }
    );
  }, [score]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" className="stroke-white/10" strokeWidth="8" fill="none" />
            <circle 
              ref={ringRef}
              cx="40" 
              cy="40" 
              r="36" 
              className="stroke-primary" 
              strokeWidth="8" 
              fill="none" 
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 36}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white">{score}%</span>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Profile Completion</h2>
          <Link to="/profile" className="text-xs text-primary hover:text-white transition-colors">
            Complete Profile →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              item.complete ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-transparent'
            }`}>
              {item.complete ? '✓' : ''}
            </span>
            <span className={`text-xs font-semibold ${item.complete ? 'text-gray-300' : 'text-gray-500'}`}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileCard;
