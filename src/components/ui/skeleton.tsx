import { cn } from '@/lib/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg shimmer-bg animate-shimmer',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-primary bg-bg-secondary/50 p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-border-primary bg-bg-secondary/50 p-5 space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function SkeletonLogViewer({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-2 p-4 rounded-xl bg-bg-primary/50 border border-border-primary">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 rounded ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-full' : 'w-1/2'}`} />
      ))}
    </div>
  );
}

export function SkeletonFileTree({ items = 8 }: { items?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 4) * 12}px` }}>
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className={`h-3 ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
        </div>
      ))}
    </div>
  );
}
