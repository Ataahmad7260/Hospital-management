import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ToastProps {
  message: string;
  isError?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isError }) => {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-2xl transition-all duration-200 ${
        isError
          ? 'bg-mono-800 text-white border border-mono-600'
          : 'bg-white text-black'
      }`}
    >
      {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span>{message}</span>
    </div>
  );
};
