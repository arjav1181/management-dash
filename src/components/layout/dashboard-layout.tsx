'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { usePathname, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { useEffect } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, init } = useSettingsStore();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (hydrated && !user && !isLoginPage) {
      router.replace('/login');
    }
  }, [hydrated, user, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (!hydrated || !user) return <div className="h-screen bg-bg-primary" />;

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
