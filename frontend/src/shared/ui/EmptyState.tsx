import React from 'react';
import { cn } from '@/lib/utils';

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, icon, className = '' }) => {
  return (
    <div
      className={cn(
        'text-center py-12 px-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 backdrop-blur-xs transition-colors hover:border-border',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3.5 shadow-xs">
          {icon}
        </div>
      )}
      <div className="font-semibold text-sm text-foreground tracking-tight">{title}</div>
      {description && (
        <div className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
