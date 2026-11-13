import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  icon,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'w-full max-w-full min-w-0 overflow-hidden bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-6 shadow-sm transition-colors',
        className
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between mb-4 gap-4 min-w-0 max-w-full">
          <div className="min-w-0 flex-1 basis-56">
            {title && (
              <div className="text-base font-semibold text-foreground flex items-center gap-2 min-w-0">
                {icon && <span className="text-primary shrink-0">{icon}</span>}
                <span className="min-w-0 break-words">{title}</span>
              </div>
            )}
            {subtitle && <div className="text-xs text-muted-foreground mt-1 break-words">{subtitle}</div>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2 max-w-full min-w-0">{action}</div>}
        </div>
      )}
      <div className="w-full max-w-full min-w-0">{children}</div>
    </div>
  );
};

export interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, subtext, icon, className = '' }) => {
  return (
    <div
      className={cn(
        'w-full max-w-full min-w-0 overflow-hidden bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-6 shadow-sm transition-colors flex flex-col justify-between gap-3',
        className
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
        <span className="truncate pr-2">{label}</span>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold font-mono text-foreground tracking-tight">{value}</div>
      {subtext && <div className="text-xs text-muted-foreground font-sans">{subtext}</div>}
    </div>
  );
};
