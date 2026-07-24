import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardBody } from './Card';

/**
 * Reusable Widget Container
 * Automatically handles loading skeletons and error/retry boundaries.
 */
export const WidgetContainer = ({ 
  title, 
  isLoading, 
  error, 
  onRetry, 
  children, 
  className = '',
  headerAction = null 
}) => {
  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {headerAction}
            {onRetry && (
              <button 
                onClick={onRetry} 
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardBody className="flex-1 pt-0">
        {isLoading ? (
          <div className="animate-pulse space-y-4 w-full h-full min-h-[100px] bg-gray-100 dark:bg-gray-800 rounded-md"></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error.message || "Failed to load data"}</p>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>Try Again</Button>
            )}
          </div>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
};
