'use client';

import { cn } from '@/lib/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ className, label, options, placeholder, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <select
        className={cn(
          'w-full rounded-lg border border-border-primary bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 appearance-none cursor-pointer',
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
    </div>
  );
}
