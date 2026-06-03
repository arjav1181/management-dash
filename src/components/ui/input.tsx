'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40',
            icon && 'pl-10',
            error && 'border-rose/50 focus:ring-rose/40',
            !error && 'border-border-primary',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
