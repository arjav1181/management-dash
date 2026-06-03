'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, placeholder, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-border-primary bg-bg-tertiary px-4 py-2.5 pr-10 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 appearance-none cursor-pointer',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  )
);
Select.displayName = 'Select';
