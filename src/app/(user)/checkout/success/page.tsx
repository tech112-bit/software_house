import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { redirect } from 'next/navigation';

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Get the user's most recent order
  const recentOrder = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      licenses: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!recentOrder) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find your order. Please check your account or contact support.
        </p>
        <Link
          href="/account"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
        >
          View Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Payment Successful!
        </h1>
        <p className="text-lg text-muted-foreground">
          Thank you for your purchase. Your order has been processed successfully.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Order Details</h2>
          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Order Number</h3>
            <p className="font-mono">{recentOrder.id}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Order Date</h3>
            <p>{new Date(recentOrder.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Total Amount</h3>
            <p className="text-lg font-bold text-primary">{formatPrice(recentOrder.total)}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Payment Method</h3>
            <p>Credit Card</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-4">
          <h3 className="font-semibold">Items Purchased</h3>
          {recentOrder.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-background">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{item.product.name}</h4>
                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* License Keys */}
      {recentOrder.licenses.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your License Keys</h2>
          <p className="text-muted-foreground mb-6">
            Save these license keys - you'll need them to activate your software. You can also find them in your account.
          </p>
          
          <div className="space-y-4">
            {recentOrder.licenses.map((license) => (
              <div key={license.id} className="border rounded-lg p-4 bg-background">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{license.product.name}</h3>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                    License Key
                  </span>
                </div>
                <div className="bg-muted p-3 rounded font-mono text-sm flex items-center justify-between">
                  <span>{license.key}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(license.key)}
                    className="text-primary hover:text-primary/80 text-xs"
                    title="Copy to clipboard"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">What's Next?</h2>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200">
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Check your email for download links and installation instructions
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Use your license keys to activate the software
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Contact support if you need help with installation
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/account"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
        >
          View My Account
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
