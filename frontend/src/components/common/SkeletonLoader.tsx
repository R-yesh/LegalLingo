import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/80 rounded-xl",
        className
      )}
      {...props}
    />
  );
};

export const DocumentAnalysisSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto p-4 sm:p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>

      {/* Attention Items Skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
