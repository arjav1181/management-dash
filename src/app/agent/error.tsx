'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, Bot } from 'lucide-react';

export default function AgentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-rose/10 flex items-center justify-center mb-4"><Bot size={32} className="text-rose" /></div>
      <h2 className="text-lg font-semibold text-text-primary">Something went wrong</h2>
      <p className="text-sm text-text-muted mt-1 mb-6 max-w-md">{error.message}</p>
      <Button onClick={reset}><RefreshCw size={16} /> Reload</Button>
    </div>
  );
}
