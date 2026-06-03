'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NAV_ITEMS } from '@/lib/utils/constants';
import {
  LayoutDashboard, Boxes, Triangle, GitBranch, Terminal, Bot, Settings,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { APP_NAME } from '@/lib/utils/constants';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  Boxes: <Boxes size={20} />,
  Triangle: <Triangle size={20} />,
  GitBranch: <GitBranch size={20} />,
  Terminal: <Terminal size={20} />,
  Bot: <Bot size={20} />,
  Settings: <Settings size={20} />,
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === '/login') return null;

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-bg-secondary border-r border-border-primary transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className={cn('flex items-center px-4 h-16 border-b border-border-primary', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold text-accent tracking-tight">{APP_NAME}</h1>
            <p className="text-[10px] text-text-muted leading-tight">infra control center</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-tertiary"
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
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              )}
              title={collapsed ? item.label : undefined}
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
    </aside>
  );
}
