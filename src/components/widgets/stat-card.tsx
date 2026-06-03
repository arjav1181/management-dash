'use client';

import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
            {trend && (
              <div className={cn('flex items-center gap-1 text-xs mt-1', trend.positive ? 'text-emerald' : 'text-rose')}>
                {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          {icon && <div className="text-accent/40">{icon}</div>}
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0" />
    </Card>
  );
}
