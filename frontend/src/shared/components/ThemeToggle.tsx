import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<Props> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={cn(
        'cursor-pointer select-none transition-colors gap-2 h-9 px-3 border-border hover:bg-muted',
        className
      )}
      title={`Switch to ${theme === 'dark' ? 'Light (White)' : 'Dark (True Black)'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun size={15} className="text-amber-400 shrink-0 transition-transform duration-200 hover:rotate-45" />
          {showLabel ? <span className="text-xs font-medium">Light Mode</span> : null}
        </>
      ) : (
        <>
          <Moon size={15} className="text-primary shrink-0 transition-transform duration-200 hover:-rotate-12" />
          {showLabel ? <span className="text-xs font-medium">Dark Mode</span> : null}
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
