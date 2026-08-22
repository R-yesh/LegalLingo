import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  bordered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  bordered = true,
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-surface rounded-2xl transition-all duration-200',
        bordered && 'border border-slate-200/80 shadow-whisper',
        hoverable && 'hover:shadow-diffused hover:border-slate-300 transition-all cursor-pointer',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
