'use client';

import { PageHeader } from '@/components/ui/surface';
import { QuickSale } from '@/features/sales/pos';

export default function NewSalePage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Quick Sale" subtitle="Tap products, choose payment, share the receipt." />
      <QuickSale />
    </div>
  );
}
