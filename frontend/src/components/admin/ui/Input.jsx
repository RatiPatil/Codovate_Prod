import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || Math.random().toString(36).substring(7);
  const baseInputClasses = "block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed";
  const errorClasses = error ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:text-red-400" : "";
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputClasses} ${errorClasses} ${LeftIcon ? 'pl-10' : ''} ${RightIcon ? 'pr-10' : ''}`}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <RightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!error && helperText && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
