'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface ProductSortSelectProps {
  defaultValue?: string;
}

export default function ProductSortSelect({ defaultValue = 'createdAt' }: ProductSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'createdAt') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
      value={searchParams.get('sort') || defaultValue}
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="createdAt">Newest First</option>
      <option value="name">Name</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
