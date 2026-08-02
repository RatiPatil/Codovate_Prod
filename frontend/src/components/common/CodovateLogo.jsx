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
 *
 * responsive (boolean):
 *   Uses mobile(64px) -> tablet(80px) -> laptop(96px) -> desktop(102px)
 */
const SIZE_MAP = {
  xs:  'h-9',          // 36px
  sm:  'h-[64px]',     // 64px
  md:  'h-[80px]',     // 80px
  lg:  'h-[96px]',     // 96px
  xl:  'h-[102px]',    // 102px
  xxl: 'h-[120px]',    // 120px
};

export const CodovateLogo = ({
  className = '',
  size = 'xl',
  responsive = false,
  ...props
}) => {
  const heightClass = responsive
    ? 'h-[64px] sm:h-[80px] lg:h-[96px] xl:h-[102px]'
    : (SIZE_MAP[size] || SIZE_MAP.xl);

  return (
    <img
      src="/favicon.png?v=3"
      alt="Codovate"
      className={`${heightClass} w-auto object-contain shrink-0 select-none ${className}`}
      draggable={false}
      {...props}
    />
  );
};

export default CodovateLogo;
