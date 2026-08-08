import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import Logo from '../common/Logo';
import LoginWorkspaceVisual from './LoginWorkspaceVisual';
import { Sparkles, ShieldCheck, Code2, Rocket, Briefcase, Users, BookOpen } from 'lucide-react';

const AuthBrandPanel = ({
  badge = 'Codovate Career Ecosystem',
  title = 'Build Your Skills. Build Your Career.',
  subtitle = 'Join India\'s premier student developer ecosystem to learn computer science, build production projects, and land software roles.',
  benefits = [
    {
      icon: Briefcase,
      title: 'Curated Tech Opportunities',
      desc: 'Connect with top tech companies and startups',
    },
    {
      icon: Code2,
      title: 'Production Project Workspaces',
      desc: 'Build & deploy microservices with team tools',
    },
    {
      icon: Rocket,
      title: 'AI Career Readiness Score',
      desc: 'Track your DSA, projects, and interview readiness',
    },
  ],
}) => {
  const [isDark, setIsDark] = useState(false);
  const logoRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (logoRef.current) {
        tl.fromTo(logoRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 });
      }

      if (infoRef.current) {
        tl.fromTo(
          infoRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          '-=0.4'
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Top: Logo */}
      <div ref={logoRef} className="pt-2">
        <Link to="/" className="inline-block focus:outline-none">
          <Logo variant={isDark ? 'dark' : 'light'} size="xs" responsive />
        </Link>
      </div>

      {/* Center: Main Copy & Benefits */}
      <div ref={infoRef} className="max-w-md my-auto space-y-6 py-2">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{badge}</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
          {title}
        </h1>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-normal">
          {subtitle}
        </p>

        {/* Benefit Bullets */}
        <div className="space-y-3.5 pt-2">
          {benefits.map((b, i) => {
            const IconComp = b.icon || ShieldCheck;
            return (
              <div key={i} className="flex items-start gap-3.5 group">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                  <IconComp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {b.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    {b.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Modern Technology/Workspace Illustration */}
      <div className="pt-2">
        <LoginWorkspaceVisual className="w-full opacity-95 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default AuthBrandPanel;
