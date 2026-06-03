import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-28 rounded-lg" />)}
      </div>
      <div className="rounded-xl border border-border-primary bg-bg-secondary/50 p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
