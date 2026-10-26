import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap select-none';

  const variantClasses = {
    primary: 'bg-white text-black hover:bg-mono-200 border border-white',
    secondary: 'bg-mono-800 text-white hover:bg-mono-700 border border-mono-700 hover:border-mono-600',
    outline: 'bg-transparent text-white border border-mono-700 hover:border-white hover:bg-mono-900',
    ghost: 'bg-transparent text-mono-400 hover:text-white hover:bg-mono-850',
  }[variant];

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs rounded',
    md: 'px-3.5 py-1.5 text-xs rounded-md',
    lg: 'px-5 py-2.5 text-sm rounded-lg',
  }[size];

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
