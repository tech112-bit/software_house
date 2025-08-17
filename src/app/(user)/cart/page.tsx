'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [provider, setProvider] = useState<'stripe' | 'paypal' | 'razorpay' | 'flutterwave'>('stripe');
  const [loading, setLoading] = useState(false);
  const { status } = useSession();

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = totalPrice * 0.08; // 8% tax
  const finalTotal = totalPrice + tax;

  useEffect(() => {
    const existing = document.cookie.split('; ').find((c) => c.startsWith('csrf-token='))
    if (!existing) {
      const token = Math.random().toString(36).slice(2)
      document.cookie = `csrf-token=${token}; path=/; SameSite=Lax`
    }
  }, [])

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf-token='))?.split('=')[1] || ''
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({
          provider,
          items: cartItems,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/cart`,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Checkout failed (${res.status}): ${text}`);
      }

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        console.warn('Checkout response (JSON without url):', data);
        alert('Checkout started, but no redirect URL was provided.');
      } else {
        const text = await res.text();
        console.error('Non-JSON response from checkout endpoint:', text);
        alert('Received an unexpected response from the server. Please check the console and server logs.');
      }
    } catch (error) {
      console.error('checkout error', error);
      alert((error as Error)?.message || 'Something went wrong starting the checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Shopping Cart
        </h1>
        <p className="text-muted-foreground">
          Review your items and proceed to checkout
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-muted-foreground">
              <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added any products to your cart yet.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auth notice */}
            {status !== 'authenticated' && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-amber-800 dark:text-amber-200">
                    You need to sign in to complete your purchase
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Items in your cart</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-background">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                      <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Digital Download</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                        <span className="text-sm text-muted-foreground">× {item.quantity}</span>
                      </div>
                    </div>
                    <button 
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-6">
                <label htmlFor="provider" className="block text-sm font-medium mb-2">
                  Payment Method
                </label>
                <select
                  id="provider"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'stripe' | 'paypal' | 'razorpay' | 'flutterwave')}
                >
                  <option value="stripe">Credit Card (Stripe)</option>
                  <option value="paypal">PayPal (Demo)</option>
                  <option value="razorpay">Razorpay (Demo)</option>
                  <option value="flutterwave">Flutterwave (Demo)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  onClick={status === 'authenticated' ? handleCheckout : () => signIn(undefined, { callbackUrl: `${window.location.origin}/cart` })}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : status === 'authenticated' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Proceed to Checkout
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Sign in to Checkout
                    </span>
                  )}
                </button>

                <button 
                  className="w-full px-6 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
                  onClick={() => clearCart()}
                  disabled={loading}
                >
                  Clear Cart
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Secure 256-bit SSL encryption
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Instant download after payment
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    30-day money-back guarantee
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Shopping */}
            <Link
              href="/products"
              className="block text-center px-6 py-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}