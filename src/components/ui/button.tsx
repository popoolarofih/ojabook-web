import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Main buttons: 8px vertical and 12px horizontal padding (skill B2), Button text styles (B1).
 * States: hover, active (scale 0.98), visible focus (global), disabled and loading.
 */
export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg transition-oja select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-royal text-white hover:bg-royal-deep',
        // Orange is used deliberately, for the single most important marketing action.
        accent: 'bg-orange text-charcoal hover:bg-white',
        secondary: 'border border-line bg-white text-ink hover:bg-soft',
        'secondary-dark': 'border border-line-dark bg-transparent text-white hover:bg-charcoal-elevated',
        ghost: 'text-ink hover:bg-white',
        danger: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        xs: 'button-xsm px-2 py-1',
        sm: 'button-sm px-3 py-1',
        md: 'button-md min-h-10 px-3 py-2',
        lg: 'button-lg min-h-12 px-4 py-3',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading, loadingText, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    >
      {loading ? (loadingText ?? 'Working') : children}
    </button>
  );
});
