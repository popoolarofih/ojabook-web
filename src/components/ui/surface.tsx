import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Cards have a full border or none, never a single sided one. */
export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line bg-white p-4 md:p-6', className)} {...p} />;
}

const tones = {
  neutral: 'bg-soft text-muted',
  blue: 'bg-royal-tint text-royal-deep',
  orange: 'bg-warning-tint text-warning-ink',
  green: 'bg-success-tint text-success-ink',
  red: 'bg-danger-tint text-danger',
} as const;

/** Status is always text plus a tone, never colour alone (guide 5.6). */
export function Badge({ tone = 'neutral', children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return <span className={cn('caption-3 inline-flex items-center rounded-full px-2 py-1', tones[tone], className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-lg', className)} />;
}

/** Skeleton shaped like a list of rows, used for loading states (skill B9). */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      {icon ? <div className="flex size-12 items-center justify-center rounded-full bg-royal-tint text-royal">{icon}</div> : null}
      <h3 className="heading-6 text-ink">{title}</h3>
      <p className="body-6 max-w-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-danger bg-danger-tint p-4">
      <p className="body-5 text-danger">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="button-sm rounded-lg border border-danger px-3 py-1 text-danger transition-oja hover:bg-white">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="heading-4 text-ink">{title}</h1>
        {subtitle ? <p className="body-6 text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'default' | 'warn' }) {
  return (
    <Card className="flex flex-col gap-1 p-4 md:p-4">
      <span className="caption-1 text-muted">{label}</span>
      <span className={cn('heading-5 tabular', tone === 'warn' ? 'text-warning-ink' : 'text-ink')}>{value}</span>
      {hint ? <span className="caption-5 text-muted">{hint}</span> : null}
    </Card>
  );
}
