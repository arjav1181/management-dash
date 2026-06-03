'use client';

import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/huggingface': 'HF Spaces',
  '/vercel': 'Vercel Projects',
  '/github': 'GitHub Repositories',
  '/agent': 'AI Agent',
  '/settings': 'Settings',
  '/login': 'Login',
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useSettingsStore();

  if (pathname === '/login') return null;

  const title = Object.entries(pageTitles).find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] || 'Dashboard';

  return (
    <header className="h-16 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        <p className="text-xs text-text-muted">{pathname}</p>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <User size={16} className="text-text-muted" />
              <span>{user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
