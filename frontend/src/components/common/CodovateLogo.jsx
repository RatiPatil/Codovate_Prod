import React from 'react';

/**
 * CodovateLogo — Canonical Global Logo Component
 * Single Source of Truth for the Codovate brand mark across the entire application.
 *
 * Size Breakdowns:
 *   xs  — 36px  (Top nav bar / compact headers)
 *   sm  — 64px  (Mobile: ~58–70px)
 *   md  — 80px  (Tablet: ~72–85px)
 *   lg  — 96px  (Laptop: ~90–100px)
 *   xl  — 102px (Desktop: ~96–105px)
 *   xxl — 120px (Splash / Hero screens)
 *   hero — ~180-230px (Centered Hero screen)
 *
 * variant:
 *   'dark'  (Default: White wordmark for dark backgrounds)
 *   'light' (Dark navy wordmark for white/light backgrounds)
 */
const SIZE_MAP = {
  xs:   'h-9',           // 36px
  sm:   'h-[64px]',      // 64px
  md:   'h-[80px]',      // 80px
  lg:   'h-[96px]',      // 96px
  xl:   'h-[102px]',     // 102px
  xxl:  'h-[120px]',     // 120px
  hero: 'h-[140px] sm:h-[180px] lg:h-[210px]', // Hero centered size (~180-230px width)
};

export const CodovateLogo = ({
  className = '',
  size = 'xl',
  responsive = false,
  variant = 'dark',
  ...props
}) => {
  const heightClass = responsive
    ? 'h-[64px] sm:h-[80px] lg:h-[96px] xl:h-[102px]'
    : (SIZE_MAP[size] || SIZE_MAP.xl);

  const logoSrc = variant === 'light' ? '/logo-light.png' : '/logo.png';

  return (
    <img
      src={logoSrc}
      alt="Codovate"
      className={`${heightClass} w-auto object-contain shrink-0 select-none ${className}`}
      draggable={false}
      {...props}
    />
  );
};

export default CodovateLogo;
