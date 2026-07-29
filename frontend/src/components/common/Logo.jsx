import React from 'react';

const Logo = ({ variant = 'auto', className = '', size = 'md' }) => {
  // variant: 'light' -> white text (for dark bg)
  // variant: 'dark' -> dark text (for light bg)
  // variant: 'auto' -> adapts via CSS classes (dark:text-white)

  let textClass = 'text-gray-900 dark:text-white';
  if (variant === 'light') textClass = 'text-white';
  if (variant === 'dark') textClass = 'text-gray-900';

  const sizeClasses = {
    sm: { img: 'h-6', text: 'text-lg' },
    md: { img: 'h-8', text: 'text-xl' },
    lg: { img: 'h-10', text: 'text-2xl' },
    xl: { img: 'h-14', text: 'text-3xl' },
  };

  const sz = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img 
        src="/favicon.png?v=3" 
        alt="Codovate Icon" 
        className={`${sz.img} object-contain shrink-0`} 
      />
      <span className={`font-black tracking-tight ${sz.text} ${textClass}`}>
        CODOVATE
      </span>
    </div>
  );
};

export default Logo;
