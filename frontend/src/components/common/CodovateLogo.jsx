import React from 'react';

/**
 * CodovateLogo — Canonical Global Logo Component
 * Single Source of Truth for the Codovate brand mark across the entire application.
 */
const SIZE_MAP = {
  xs:   'h-8 sm:h-9',     // 32px–36px (Slightly larger, premium fit for top nav bar)
  sm:   'h-[46px]',       // 46px
  md:   'h-[60px]',       // 60px
  lg:   'h-[78px]',       // 78px
  xl:   'h-[104px]',      // 104px
  xxl:  'h-[130px]',      // 130px
  hero: 'h-[150px] sm:h-[190px] lg:h-[220px]',
};

export const CodovateLogo = ({
  className = '',
  size = 'xs',
  responsive = false,
  variant = 'light',
  ...props
}) => {
  const heightClass = responsive
    ? 'h-8 sm:h-9 lg:h-10'
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
