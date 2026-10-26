import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto rounded-lg border border-mono-800 bg-mono-950 ${className}`}>
      <table className="w-full text-left text-xs border-collapse">{children}</table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <thead>{children}</thead>;
};

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <tbody className="divide-y divide-mono-800">{children}</tbody>;
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <tr
      className={`border-b border-mono-800 hover:bg-mono-850 transition-colors ${className}`}
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
      className={`px-4 py-3 bg-mono-950 text-mono-400 font-semibold text-[0.7rem] uppercase tracking-wider border-b border-mono-800 whitespace-nowrap ${className}`}
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
    <td className={`px-4 py-3 text-mono-200 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
};
