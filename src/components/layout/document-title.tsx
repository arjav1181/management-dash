'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
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

function titleForPath(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  for (const [prefix, title] of Object.entries(TITLES)) {
    if (prefix !== '/' && pathname.startsWith(`${prefix}/`)) return title;
  }
  return 'Dashboard';
}

export function DocumentTitle() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const base = 'Bridge';
    const section = titleForPath(pathname);
    document.title = section === 'Dashboard' ? base : `${section} — ${base}`;
  }, [pathname]);
  return null;
}
