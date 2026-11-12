import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 max-w-full whitespace-normal sm:whitespace-nowrap text-center leading-tight rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-xs',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500',
      },
      size: {
        default: 'min-h-9 h-auto px-4 py-2',
        sm: 'min-h-8 h-auto px-3 py-1.5 text-xs rounded-md',
        md: 'min-h-9 h-auto px-4 py-2 text-sm rounded-md',
        lg: 'min-h-10 h-auto px-6 py-2.5 text-base rounded-md',
        icon: 'h-9 w-9 p-0 shrink-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
