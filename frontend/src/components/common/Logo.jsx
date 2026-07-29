import React from 'react';

/**
 * Icon-only brand mark — official Codovate gradient icon.
 * No text. Ever.
 *
 * size prop:
 *   'xs'  — 40px  (compact nav / onboarding step)
 *   'sm'  — 60px  (mobile header)
 *   'md'  — 72px  (tablet / small panel)
 *   'lg'  — 90px  (laptop / auth panels)
 *   'xl'  — 100px (desktop / main sidebar)
 *   'xxl' — 120px (hero / splash / welcome)
 *
 * responsive prop (boolean, default false):
 *   When true, uses mobile:sm → tablet:md → laptop:lg → desktop:xl
 *   automatically via Tailwind responsive prefixes.
 */
const Logo = ({ className = '', size = 'xl', responsive = false }) => {
  // Map size names → Tailwind height classes (w-auto keeps aspect ratio)
  const sizeMap = {
    xs:  'h-10',   // 40px
    sm:  'h-[60px]',  // 60px — mobile
    md:  'h-[72px]',  // 72px — tablet
    lg:  'h-[90px]',  // 90px — laptop
    xl:  'h-[100px]', // 100px — desktop
    xxl: 'h-[120px]', // 120px — splash / hero
  };

  const heightClass = responsive
    ? 'h-[60px] sm:h-[72px] lg:h-[90px] xl:h-[100px]'
    : (sizeMap[size] || sizeMap.xl);

  return (
    <img
      src="/favicon.png?v=3"
      alt="Codovate"
      className={`${heightClass} w-auto object-contain shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
};

export default Logo;
