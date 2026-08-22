import React from 'react';
import { cn } from '../../lib/utils';
import { AttentionLevel } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'verified' | 'standard' | 'review' | 'attention' | 'outline';
  severity?: AttentionLevel;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  severity,
  ...props
}) => {
  let badgeClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide';

  if (severity) {
    switch (severity) {
      case 'VERIFIED':
        badgeClasses = cn(badgeClasses, 'bg-emerald-100 text-emerald-800 border border-emerald-300');
        break;
      case 'STANDARD':
        badgeClasses = cn(badgeClasses, 'bg-blue-100 text-blue-800 border border-blue-300');
        break;
      case 'REVIEW':
        badgeClasses = cn(badgeClasses, 'bg-amber-100 text-amber-900 border border-amber-300');
        break;
      case 'HIGH ATTENTION':
        badgeClasses = cn(badgeClasses, 'bg-rose-100 text-rose-900 border border-rose-300');
        break;
    }
  } else {
    switch (variant) {
      case 'verified':
        badgeClasses = cn(badgeClasses, 'bg-emerald-100 text-emerald-800 border border-emerald-300');
        break;
      case 'standard':
        badgeClasses = cn(badgeClasses, 'bg-blue-100 text-blue-800 border border-blue-300');
        break;
      case 'review':
        badgeClasses = cn(badgeClasses, 'bg-amber-100 text-amber-900 border border-amber-300');
        break;
      case 'attention':
        badgeClasses = cn(badgeClasses, 'bg-rose-100 text-rose-900 border border-rose-300');
        break;
      case 'outline':
        badgeClasses = cn(badgeClasses, 'border border-slate-300 text-slate-700 bg-white');
        break;
      default:
        badgeClasses = cn(badgeClasses, 'bg-slate-100 text-slate-800 border border-slate-200');
        break;
    }
  }

  return (
    <span className={cn(badgeClasses, className)} {...props}>
      {children}
    </span>
  );
};
