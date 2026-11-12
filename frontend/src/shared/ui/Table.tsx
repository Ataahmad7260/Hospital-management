import React from 'react';
import { cn } from '@/lib/utils';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={cn('relative w-full overflow-auto rounded-xl border border-border bg-card shadow-sm', className)}>
      <table className="w-full text-left text-sm border-collapse">{children}</table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <thead className={cn('border-b border-border bg-muted/40', className)}>{children}</thead>;
};

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <tbody className={cn('divide-y divide-border [&_tr:last-child]:border-0', className)}>{children}</tbody>;
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap',
        className
      )}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}> = ({ children, className = '', colSpan }) => {
  return (
    <td className={cn('p-4 align-middle text-foreground', className)} colSpan={colSpan}>
      {children}
    </td>
  );
};
