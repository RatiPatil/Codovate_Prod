import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import Logo from '../common/Logo';
import LoginWorkspaceVisual from './LoginWorkspaceVisual';

const AuthBrandPanel = ({
  title = 'Build. Learn. Grow.',
  subtitle = 'Your journey to skills, projects, and opportunities starts here.',
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
        tl.fromTo(logoRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 });
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
          { opacity: 0, y: 18, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          '-=0.4'
        );

        // Subtle continuous float loop
        gsap.to(visualRef.current, {
          y: '-=8',
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.7,
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col justify-center space-y-6 max-w-[400px]">
      {/* Codovate Official Logo (Width 150-180px) */}
      <div ref={logoRef} className="w-[160px]">
        <Link to="/" className="inline-block focus:outline-none">
          <Logo variant={isDark ? 'dark' : 'light'} size="xs" responsive />
        </Link>
      </div>

      {/* Headline & Subtitle */}
      <div ref={infoRef} className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Coding Workspace Illustration (Width 280-380px) */}
      <div ref={visualRef} className="pt-2 w-full max-w-[340px]">
        <LoginWorkspaceVisual className="w-full h-auto opacity-95 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default AuthBrandPanel;
