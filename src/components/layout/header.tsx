'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { LogOut, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from '@/lib/i18n';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/huggingface': 'HF Spaces',
  '/vercel': 'Vercel Projects',
  '/github': 'GitHub Repositories',
  '/agent': 'AI Agent',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
  '/search': 'Search',
  '/profile': 'Profile',
  '/docker': 'Docker Hub',
  '/gitlab': 'GitLab',
  '/netlify': 'Netlify',
  '/login': 'Login',
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useSettingsStore();
  const { unread } = useNotifications();

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
            <Link
              href="/notifications"
              aria-label={`Notifications, ${unread} unread`}
              className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose text-white text-[10px] font-semibold flex items-center justify-center"
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <LocaleSwitcher />
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
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
