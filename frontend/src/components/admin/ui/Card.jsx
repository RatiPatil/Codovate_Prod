import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg leading-6 font-medium text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`px-4 py-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
      {children}
    </div>
  );
};
