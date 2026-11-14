import { cn } from '@/lib/utils';

/** OjaBook mark: an open book whose pages form a market stall awning. Drawn, not a font glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="8" fill="#105BFF" />
      <path d="M8 22V11.5c0-.8.7-1.5 1.5-1.5H15v13H9.5A1.5 1.5 0 0 1 8 22Z" fill="#fff" />
      <path d="M17 10h5.5c.8 0 1.5.7 1.5 1.5V22a1.5 1.5 0 0 1-1.5 1.5H17V10Z" fill="#fff" opacity=".78" />
      <rect x="8" y="24.5" width="16" height="2" rx="1" fill="#FE8500" />
    </svg>
  );
}

export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className={cn('font-display text-xl font-semibold', tone === 'light' ? 'text-white' : 'text-ink')}>OjaBook</span>
    </span>
  );
}
