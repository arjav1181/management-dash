'use client';

import dynamic from 'next/dynamic';
import { SkeletonCard } from '@/components/ui/skeleton';

export const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => <SkeletonCard />,
});
