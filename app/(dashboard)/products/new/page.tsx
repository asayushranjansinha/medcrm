'use client';

import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/products/product-form';
import { useCreateProduct } from '@/hooks/use-products';
import type { CreateProductInput } from '@/lib/validations/product';

export default function NewProductPage() {
  const create = useCreateProduct();

  return (
    <div className="space-y-6">
      <PageHeader title="Add product" description="Define SKU, pricing, and stock" />
      <ProductForm
        submitLabel="Create product"
        onSubmit={async (data) => {
          await create.mutateAsync(data as CreateProductInput);
        }}
      />
    </div>
  );
}
