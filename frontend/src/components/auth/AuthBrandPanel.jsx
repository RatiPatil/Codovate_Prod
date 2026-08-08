import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import Logo from '../common/Logo';
import LoginWorkspaceVisual from './LoginWorkspaceVisual';

const AuthBrandPanel = ({
  title = 'Welcome back',
  subtitle = 'Sign in to continue.',
}) => {
  const [isDark, setIsDark] = useState(false);
  const logoRef = useRef(null);
  const infoRef = useRef(null);
  const visualRef = useRef(null);

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
        tl.fromTo(logoRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
      }

      if (infoRef.current) {
        tl.fromTo(
          infoRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.3'
        );
      }

      if (visualRef.current) {
        tl.fromTo(
          visualRef.current,
          { opacity: 0, y: 15, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          '-=0.4'
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Top: Codovate Logo */}
      <div ref={logoRef} className="pt-2">
        <Link to="/" className="inline-block focus:outline-none">
          <Logo variant={isDark ? 'dark' : 'light'} size="xs" responsive />
        </Link>
      </div>

      {/* Center: Short, Focused Headline & Subtitle */}
      <div ref={infoRef} className="max-w-sm my-auto space-y-2 py-4">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Bottom: Clean Coding Workspace Illustration (30-40% Visual Footprint) */}
      <div ref={visualRef} className="pt-2 max-w-[340px] w-full mx-auto">
        <LoginWorkspaceVisual className="w-full h-auto opacity-95 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default AuthBrandPanel;
