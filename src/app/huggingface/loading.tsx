import { SkeletonCard } from '@/components/ui/skeleton';

export default function HFLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-bg-tertiary rounded-lg shimmer-bg animate-shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
