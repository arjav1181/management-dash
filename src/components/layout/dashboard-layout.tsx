'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { useEffect } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, isReady } = useSettingsStore();

  useEffect(() => {
    if (isReady && !auth.isLoggedIn && pathname !== '/login') {
      router.push('/login');
    }
  }, [isReady, auth.isLoggedIn, pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!auth.isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
