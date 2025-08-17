import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import Image from 'next/image';
import ProductSortSelect from '@/components/products/ProductSortSelect';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = params.search as string | undefined;
  const category = params.category as string | undefined;
  const sort = params.sort as string | undefined;

  // Build where clause for filtering
  const where: any = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.categoryName = category;
  }

  // Build orderBy clause for sorting
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price-asc') {
    orderBy = { price: 'asc' };
  } else if (sort === 'price-desc') {
    orderBy = { price: 'desc' };
  } else if (sort === 'name') {
    orderBy = { name: 'asc' };
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
      },
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Software Products
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover our collection of premium software solutions designed to boost your productivity and creativity.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !category
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground border border-border hover:bg-accent'
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat.name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground border border-border hover:bg-accent'
              }`}
            >
              {cat.name} ({cat._count.products})
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          <ProductSortSelect defaultValue="createdAt" />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const images = JSON.parse(product.images || '[]');
          const firstImage = images[0];

          return (
            <div
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Product Image */}
              <div className="relative aspect-video overflow-hidden bg-muted flex items-center justify-center">
                {firstImage ? (
                  <Image
                    src={firstImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No Image</span>
                  </div>
                )}
                {product.isFeatured && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                    Featured
                  </div>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Sale
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.shortDescription || product.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="bg-accent px-2 py-1 rounded">
                    {product.category.name}
                  </span>
                  {product.version && (
                    <span className="bg-accent px-2 py-1 rounded">v{product.version}</span>
                  )}
                </div>

                <div className="flex-1" />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                    View Details
                  </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No products found */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <svg
              className="h-12 w-12 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8v2a1 1 0 01-1 1h-1m-1-3v2a1 1 0 00 1 1h1m-1-3h1a1 1 0 00 1 1v-1M6 9V6a2 2 0 012-2h3"
              />
            </svg>
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
}