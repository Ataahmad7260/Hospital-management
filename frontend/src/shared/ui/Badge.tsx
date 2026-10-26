import React from 'react';

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
    solid: 'bg-white text-black border border-white',
    outline: 'bg-transparent text-mono-200 border border-mono-700',
    subtle: 'bg-mono-900 text-mono-300 border border-mono-800',
    contrast: 'bg-mono-800 text-white border border-mono-600',
  }[variant];

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[0.65rem]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}>
      {children}
    </span>
  );
};

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const norm = (status || '').toUpperCase();
  const isPositive = ['ACTIVE', 'COMPLETED', 'PAID', 'DISPENSED'].includes(norm);
  const isInactive = ['CANCELLED', 'INACTIVE'].includes(norm);

  const style = isPositive
    ? 'bg-mono-800 text-white border-mono-600'
    : isInactive
    ? 'bg-transparent text-mono-500 border-mono-800 line-through'
    : 'bg-transparent text-mono-300 border-mono-700';

  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full font-mono uppercase border ${style}`}
    >
      {status}
    </span>
  );
};
