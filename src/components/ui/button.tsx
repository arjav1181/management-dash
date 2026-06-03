'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20 active:scale-[0.98]',
  secondary:
    'bg-bg-tertiary text-text-primary hover:bg-bg-elevated border border-border-primary active:scale-[0.98]',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
  danger: 'bg-rose text-white hover:bg-rose/90 shadow-lg shadow-rose/20 active:scale-[0.98]',
  outline: 'border border-accent/40 text-accent hover:bg-accent/10 active:scale-[0.98]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200',
        variantClasses[variant],
        size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';
