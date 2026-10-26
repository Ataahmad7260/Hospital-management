import React from 'react';

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => {
  return (
    <div className="text-center py-10 px-4 text-mono-400 flex flex-col items-center gap-2">
      {icon && <div className="text-mono-500 mb-1">{icon}</div>}
      <div className="font-semibold text-sm text-mono-200">{title}</div>
      {description && <div className="text-xs text-mono-500 max-w-sm">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
