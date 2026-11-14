import { formatNgn } from '@/lib/money';
import { cn } from '@/lib/utils';

export function Money({ kobo, className, decimals }: { kobo: number; className?: string; decimals?: 'always' | 'auto' }) {
  return <span className={cn('tabular', className)}>{formatNgn(kobo, { decimals })}</span>;
}
