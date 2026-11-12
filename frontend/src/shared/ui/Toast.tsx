import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ToastProps {
  message: string;
  isError?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isError }) => {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-2xl transition-all duration-200 border ${
        isError
          ? 'bg-destructive text-destructive-foreground border-destructive/80 shadow-destructive/20'
          : 'bg-card text-foreground border-border shadow-lg'
      }`}
    >
      {isError ? (
        <AlertCircle size={16} className="text-destructive-foreground shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
};
