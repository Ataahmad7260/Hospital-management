import React from 'react';
import { cn } from '@/lib/utils';

export const FormGroup: React.FC<{
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, error, children, className = '' }) => {
  return (
    <div className={cn('space-y-1.5 mb-4 min-w-0 max-w-full', className)}>
      {label && (
        <label className="text-xs font-medium text-foreground tracking-wide block">
          {label}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-destructive font-medium">{error}</span>}
    </div>
  );
};

export const FormRow: React.FC<{ children: React.ReactNode; columns?: number; className?: string }> = ({
  children,
  columns = 2,
  className = '',
}) => {
  const colsClass =
    columns <= 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : columns === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid gap-4 w-full max-w-full min-w-0', colsClass, className)}>
      {children}
    </div>
  );
};
