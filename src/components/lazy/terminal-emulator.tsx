'use client';

import dynamic from 'next/dynamic';
import { SkeletonCard } from '@/components/ui/skeleton';

const TerminalEmulator = dynamic(() => import('@/components/terminal/terminal-emulator').then((m) => m.TerminalEmulator), {
  ssr: false,
  loading: () => <SkeletonCard />,
});

export default TerminalEmulator;
