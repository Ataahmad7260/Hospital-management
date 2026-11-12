import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed max-w-full whitespace-normal sm:whitespace-nowrap text-center leading-tight select-none rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-xs',
    outline: 'bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground shadow-xs',
    ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
  }[variant];

  const sizeClasses = {
    sm: 'min-h-8 h-auto px-3 py-1.5 text-xs',
    md: 'min-h-9 h-auto px-4 py-2 text-sm',
    lg: 'min-h-10 h-auto px-6 py-2.5 text-base',
  }[size];

  return (
    <button
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex items-center shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
