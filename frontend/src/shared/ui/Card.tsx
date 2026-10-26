import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
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
    <div className={`bg-mono-900 border border-mono-800 rounded-xl p-5 hover:border-mono-700 transition-colors ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            {title && (
              <div className="text-base font-bold text-white flex items-center gap-2">
                {icon && <span className="text-mono-400">{icon}</span>}
                <span>{title}</span>
              </div>
            )}
            {subtitle && <div className="text-xs text-mono-400 mt-0.5">{subtitle}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, subtext, icon }) => {
  return (
    <div className="bg-mono-900 border border-mono-800 rounded-xl p-5 hover:border-mono-700 transition-colors flex flex-col gap-2">
      <div className="flex items-center justify-between text-mono-400 text-xs font-semibold uppercase tracking-wider">
        <span>{label}</span>
        {icon && <span className="text-mono-400">{icon}</span>}
      </div>
      <div className="text-3xl font-bold font-mono text-white tracking-tight">{value}</div>
      {subtext && <div className="text-xs text-mono-500">{subtext}</div>}
    </div>
  );
};
