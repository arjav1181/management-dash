'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-bg-tertiary/60',
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border-primary bg-bg-secondary p-5', className)}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-border-primary">
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border-primary bg-bg-secondary p-5', className)}>
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full max-w-[300px]" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLogViewer({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border-primary bg-black/60 p-4', className)}>
      <div className="space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className={`h-3 ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-1/2' : 'w-2/3'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonFileTree({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5" style={{ paddingLeft: `${(i % 3) * 16}px` }}>
          <Skeleton className="h-4 w-4" />
          <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
        </div>
      ))}
    </div>
  );
}
