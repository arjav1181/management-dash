import { Skeleton } from '@/components/ui/skeleton';

export default function AgentLoading() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-pulse">
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <Skeleton className={`h-16 rounded-xl ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
          </div>
        ))}
      </div>
      <div className="h-14 bg-bg-tertiary rounded-xl shimmer-bg animate-shimmer" />
    </div>
  );
}
