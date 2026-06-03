'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('github repo error', error); }, [error]);
  return (
    <div className="space-y-4 animate-fadeIn">
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle size={36} className="text-rose mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-text-primary mb-1">Failed to load repository</h2>
          <p className="text-sm text-text-muted mb-4">{error.message || 'Unexpected error'}</p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
