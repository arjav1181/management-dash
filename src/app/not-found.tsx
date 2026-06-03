'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="text-8xl font-bold text-accent/20 select-none">404</div>
      <h1 className="text-2xl font-bold text-text-primary mt-4">Page not found</h1>
      <p className="text-text-muted mt-2 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3 mt-8">
        <Link href="/">
          <Button>
            <Home size={16} />
            Go Home
          </Button>
        </Link>
        <Button variant="secondary" onClick={() => window.history.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </div>
    </div>
  );
}
