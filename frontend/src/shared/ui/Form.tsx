import React from 'react';

export const FormGroup: React.FC<{
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, error, children, className = '' }) => {
  return (
    <div className={`mb-3.5 flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[0.7rem] font-semibold text-mono-400 uppercase tracking-wider font-mono">
          {label}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-mono-400 italic">{error}</span>}
    </div>
  );
};

export const FormRow: React.FC<{ children: React.ReactNode; columns?: number }> = ({
  children,
  columns = 2,
}) => {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
};
