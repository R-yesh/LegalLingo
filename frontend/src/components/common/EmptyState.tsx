import React from 'react';
import { Button } from './Button';
import { FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div className={cn("text-center py-12 px-4 flex flex-col items-center justify-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4 shadow-whisper">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-charcoal mb-1">{title}</h3>
      <p className="text-sm text-steel max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
};
