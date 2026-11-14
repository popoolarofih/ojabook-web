'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { EmptyState, ListSkeleton } from '@/components/ui/surface';
import { ReceiptScreen } from '@/features/sales/receipt';

/**
 * A static page that reads the sale id from the query string. Unlike a dynamic route, its shell
 * can be saved by the service worker ahead of time, so a receipt opens even with no network.
 */
function ReceiptInner() {
  const id = useSearchParams().get('id');
  if (!id) return <EmptyState title="No receipt selected" body="Open a receipt from your sales list." />;
  return <ReceiptScreen id={id} />;
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <ReceiptInner />
    </Suspense>
  );
}
