'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NAV_ITEMS, APP_NAME } from '@/lib/utils/constants';
import {
  LayoutDashboard, Boxes, Triangle, GitBranch, Terminal, Bot, Settings,
  ChevronLeft, ChevronRight, Search, Bell, Container, User, Menu, X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  Boxes: <Boxes size={20} />,
  Triangle: <Triangle size={20} />,
  GitBranch: <GitBranch size={20} />,
  Terminal: <Terminal size={20} />,
  Bot: <Bot size={20} />,
  Settings: <Settings size={20} />,
  Search: <Search size={20} />,
  Bell: <Bell size={20} />,
  Container: <Container size={20} />,
  User: <User size={20} />,
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname === '/login') return null;

  const sidebarContent = (
    <>
      <div className={cn('flex items-center h-16 border-b border-border-primary', collapsed ? 'justify-center px-2' : 'px-4 justify-between')}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-sm shadow-accent/30 group-hover:shadow-md group-hover:shadow-accent/40 transition-shadow">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 22L10 14L14 18L18 10L22 16L26 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="26" cy="8" r="2" fill="white"/>
                <circle cx="6" cy="22" r="2" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary tracking-tight">{APP_NAME}</h1>
              <p className="text-[9px] text-text-muted leading-tight">infra control center</p>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-sm shadow-accent/30">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 22L10 14L14 18L18 10L22 16L26 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="26" cy="8" r="2" fill="white"/>
              <circle cx="6" cy="22" r="2" fill="white"/>
            </svg>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-tertiary"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const href = item.href === '/huggingface' && item.label === 'Terminal' ? '/huggingface' : item.href;
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent'
              )}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {iconMap[item.icon] || <LayoutDashboard size={20} />}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('p-3 border-t border-border-primary', collapsed && 'flex justify-center')}>
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse-dot" />
            <span>All systems nominal</span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-bg-secondary border border-border-primary flex items-center justify-center text-text-primary shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-bg-secondary border-r border-border-primary overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted">
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex h-screen sticky top-0 flex-col bg-bg-secondary/90 backdrop-blur-sm border-r border-border-primary transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
