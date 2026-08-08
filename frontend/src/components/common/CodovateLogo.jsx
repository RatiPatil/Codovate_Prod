import React from 'react';

/**
 * CodovateLogo — Canonical Global Logo Component
 * Single Source of Truth for the Codovate brand mark across the entire application.
 */
const SIZE_MAP = {
  xs:   'h-7 sm:h-8',    // 28px–32px (Compact fit for top nav bar)
  sm:   'h-[42px]',      // 42px
  md:   'h-[56px]',      // 56px
  lg:   'h-[72px]',      // 72px
  xl:   'h-[96px]',      // 96px
  xxl:  'h-[120px]',     // 120px
  hero: 'h-[140px] sm:h-[180px] lg:h-[210px]',
};

export const CodovateLogo = ({
  className = '',
  size = 'xs',
  responsive = false,
  variant = 'light',
  ...props
}) => {
  const heightClass = responsive
    ? 'h-7 sm:h-8 lg:h-9'
    : (SIZE_MAP[size] || SIZE_MAP.xs);

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
