'use client';

import { PageHeader } from '@/components/ui/surface';
import { ProductForm } from '@/features/inventory/product-form';

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add a product" subtitle="Set the price, the units and the stock you have now." />
      <ProductForm />
    </div>
  );
}
