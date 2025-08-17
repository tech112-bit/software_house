import { formatPrice } from '@/lib/utils';
import { prisma } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/products/AddToCartButton';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: {
      id: id,
      isActive: true,
    },
    include: {
      category: true,
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!product) {
    notFound();
  }

  const images = JSON.parse(product.images || '[]');
  const features = JSON.parse(product.features || '[]');
  const systemRequirements = JSON.parse(product.systemRequirements || '{}');

  // Calculate average rating
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
    : 0;

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        <span>/</span>
        <Link href={`/products?category=${encodeURIComponent(product.category.name)}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-video relative overflow-hidden rounded-xl border bg-muted flex items-center justify-center">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg">No Image Available</span>
              </div>
            )}
            {product.isFeatured && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Featured
              </div>
            )}
            {discountPercentage > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {discountPercentage}% OFF
              </div>
            )}
          </div>

          {/* Additional Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {images.slice(1, 4).map((image: string, index: number) => (
                <div key={index} className="aspect-video relative overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-lg text-muted-foreground">{product.shortDescription}</p>
          </div>

          {/* Rating */}
          {product.reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {discountPercentage > 0 && (
              <p className="text-green-600 font-medium">
                Save {formatPrice(product.originalPrice! - product.price)} ({discountPercentage}% off)
              </p>
            )}
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2 font-medium">{product.category.name}</span>
            </div>
            {product.version && (
              <div>
                <span className="text-muted-foreground">Version:</span>
                <span className="ml-2 font-medium">v{product.version}</span>
              </div>
            )}
            {product.fileSize && (
              <div>
                <span className="text-muted-foreground">File Size:</span>
                <span className="ml-2 font-medium">{product.fileSize}</span>
              </div>
            )}
        <div>
              <span className="text-muted-foreground">Downloads:</span>
              <span className="ml-2 font-medium">{product.downloadLimit || 'Unlimited'}</span>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="space-y-4">
            <AddToCartButton product={product} />
            <p className="text-sm text-muted-foreground">
              ✓ Instant download after purchase<br />
              ✓ License key included<br />
              ✓ 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t pt-8">
        <div className="space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </section>

          {/* Features */}
          {features.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* System Requirements */}
          {Object.keys(systemRequirements).length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">System Requirements</h2>
              <div className="bg-card border rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(systemRequirements).map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-medium text-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </dt>
                      <dd className="text-muted-foreground mt-1">{value as string}</dd>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
            {product.reviews.length > 0 ? (
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="font-medium">{review.user.name || 'Anonymous'}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}