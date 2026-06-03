import { Card, CardContent } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="h-8 w-48 bg-bg-tertiary rounded animate-pulse" />
      <Card>
        <CardContent>
          <div className="h-96 bg-bg-tertiary/30 animate-pulse rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
