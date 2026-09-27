import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  trend, // positive, negative, neutral
  trendValue, // string e.g. "+5%"
  icon: Icon,
  isLoading,
  error,
  onRetry
}) => {
  return (
    <WidgetContainer title={title} isLoading={isLoading} error={error} onRetry={onRetry}>
      <div className="flex items-center justify-between mt-2">
        <div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {value !== undefined ? value.toLocaleString() : '-'}
          </div>
          
          {trendValue && (
            <div className="flex items-center mt-1 text-sm">
              {trend === 'positive' && <TrendingUp className="w-4 h-4 mr-1 text-green-500" />}
              {trend === 'negative' && <TrendingDown className="w-4 h-4 mr-1 text-red-500" />}
              {trend === 'neutral' && <Minus className="w-4 h-4 mr-1 text-gray-500" />}
              <span className={`
                ${trend === 'positive' ? 'text-green-600 dark:text-green-400' : ''}
                ${trend === 'negative' ? 'text-red-600 dark:text-red-400' : ''}
                ${trend === 'neutral' ? 'text-gray-500 dark:text-gray-400' : ''}
              `}>
                {trendValue}
              </span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};
