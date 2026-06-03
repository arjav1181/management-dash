'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-rose/10 flex items-center justify-center mb-6">
        <AlertTriangle size={32} className="text-rose" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
      <p className="text-text-muted mt-2 max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="mt-8">
        <Button onClick={reset}>
          <RefreshCw size={16} />
          Try Again
        </Button>
      </div>
    </div>
  );
}
