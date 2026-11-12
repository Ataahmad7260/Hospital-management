import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'subtle' | 'contrast';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'outline',
  size = 'md',
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-full font-mono font-semibold uppercase tracking-wider select-none';

  const variantClasses = {
    solid: 'bg-primary text-primary-foreground border border-primary shadow-xs',
    outline: 'bg-transparent text-foreground border border-border',
    subtle: 'bg-secondary text-secondary-foreground border border-border/60',
    contrast: 'bg-accent text-accent-foreground border border-border',
  }[variant];

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[0.65rem]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={cn(baseClasses, variantClasses, sizeClasses, className)}>
      {children}
    </span>
  );
};

export const StatusPill: React.FC<{ status: string; className?: string }> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();
  const isPositive = ['ACTIVE', 'COMPLETED', 'PAID', 'DISPENSED'].includes(norm);
  const isWarning = ['PENDING', 'IN_PROGRESS', 'SCHEDULED', 'ISSUED'].includes(norm);
  const isInactive = ['CANCELLED', 'INACTIVE'].includes(norm);

  const style = isPositive
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : isWarning
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : isInactive
    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 line-through'
    : 'bg-sky-500/15 text-sky-400 border-sky-500/30';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-full font-mono uppercase border',
        style,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};
