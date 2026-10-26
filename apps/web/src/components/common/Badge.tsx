import React from 'react';
import { cn, getPriorityBadgeColor, getStatusBadgeColor } from '../../lib/utils';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'priority' | 'status' | 'outline' | 'safety';
  value?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'outline',
  value = '',
  className = '',
}) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'priority') {
    style = getPriorityBadgeColor(value);
  } else if (variant === 'status') {
    style = getStatusBadgeColor(value);
  } else if (variant === 'safety') {
    style = 'bg-red-50 text-red-700 border-red-300 font-semibold';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
        style,
        className
      )}
    >
      {variant === 'safety' && <ShieldAlert className="w-3.5 h-3.5 text-red-600" />}
      {variant === 'priority' && value === 'EMERGENCY' && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
      {children}
    </span>
  );
};
