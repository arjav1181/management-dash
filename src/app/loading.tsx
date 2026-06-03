import { SkeletonStatCard, SkeletonTable } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-bg-tertiary rounded shimmer-bg animate-shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border-primary bg-bg-secondary/50 p-5"><SkeletonTable rows={5} /></div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary/50 p-5"><SkeletonTable rows={5} /></div>
      </div>
    </div>
  );
}
