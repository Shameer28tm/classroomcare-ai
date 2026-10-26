import React from 'react';
import { cn } from '../../lib/utils';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className = '',
}) => {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      <div className="h-6 bg-slate-200 rounded w-1/3"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div className="space-y-2 w-2/3">
            <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
            <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-slate-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};
