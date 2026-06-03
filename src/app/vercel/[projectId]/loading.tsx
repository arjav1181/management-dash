import { Card, CardContent } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="h-8 w-48 bg-bg-tertiary rounded animate-pulse" />
      <Card>
        <CardContent className="space-y-3 py-6">
          <div className="h-4 w-2/3 bg-bg-tertiary rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-bg-tertiary rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}
