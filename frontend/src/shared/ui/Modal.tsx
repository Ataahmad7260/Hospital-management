import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '540px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-mono-950 border border-mono-700 rounded-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            className="p-1 rounded text-mono-400 hover:text-white hover:bg-mono-850 cursor-pointer transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
