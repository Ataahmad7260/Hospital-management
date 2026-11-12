import React from 'react';
import { cn } from '@/lib/utils';

export const FormGroup: React.FC<{
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, error, children, className = '' }) => {
  return (
    <div className={cn('space-y-1.5 mb-4', className)}>
      {label && (
        <label className="text-xs font-medium text-foreground tracking-wide">
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
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
};
