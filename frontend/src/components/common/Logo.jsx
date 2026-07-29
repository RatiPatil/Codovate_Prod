import React from 'react';

/**
 * Icon-only brand mark. No text. Just the official Codovate gradient icon.
 * size prop: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
 */
const Logo = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm:  'h-8',
    md:  'h-12',
    lg:  'h-16',
    xl:  'h-20',
    xxl: 'h-28',
  };

  const heightClass = sizeMap[size] || sizeMap.md;

  return (
    <img
      src="/favicon.png?v=3"
      alt="Codovate"
      className={`${heightClass} w-auto object-contain shrink-0 ${className}`}
      draggable={false}
    />
  );
};

export default Logo;
