'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface License {
  id: string;
  key: string;
  isActive: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    version: string | null;
    categoryName: string;
    downloadUrl: string | null;
  };
  order: {
    id: string;
    createdAt: string;
    status: string;
  } | null;
}

interface Order {
  id: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
    };
  }[];
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses' | 'orders'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);

  const fetchUserData = async () => {
    try {
      const [licensesRes, ordersRes] = await Promise.all([
        fetch('/api/licenses'),
        fetch('/api/orders'),
      ]);

      if (licensesRes.ok) {
        const licensesData = await licensesRes.json();
        setLicenses(licensesData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border rounded-lg p-6">
                <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          Please sign in to view your account.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const activeLicenses = licenses.filter(l => l.isActive);
  const totalSpent = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Account
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0a2 2 0 01-2 2m2-2h-6m6 0a2 2 0 002 2m-2-2v6m0 0a2 2 0 01-2 2m0 0H9m6 0V9a2 2 0 00-2-2m-2 2v6m0 0a2 2 0 01-2 2H9" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Licenses</p>
              <p className="text-2xl font-bold">{activeLicenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'licenses', label: 'My Licenses', icon: '🔑' },
            { id: 'orders', label: 'Order History', icon: '📦' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Licenses */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Licenses</h3>
              <div className="space-y-3">
                {licenses.slice(0, 3).map((license) => (
                  <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <div>
                      <h4 className="font-medium">{license.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {license.product.version && `v${license.product.version} • `}
                        {license.product.categoryName}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      license.isActive 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}>
                      {license.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                {licenses.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No licenses yet</p>
                )}
              </div>
              {licenses.length > 3 && (
                <button
                  onClick={() => setActiveTab('licenses')}
                  className="w-full mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  View all licenses →
                </button>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <div>
                      <h4 className="font-medium">Order #{order.id.slice(-8)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'COMPLETED'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No orders yet</p>
                )}
              </div>
              {orders.length > 3 && (
                <button
                  onClick={() => setActiveTab('orders')}
                  className="w-full mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  View all orders →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'licenses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Licenses</h2>
            <p className="text-muted-foreground">{licenses.length} license{licenses.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {licenses.map((license) => (
              <div key={license.id} className="bg-card border rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{license.product.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        license.isActive 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                      }`}>
                        {license.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {license.product.version && `Version ${license.product.version} • `}
                      {license.product.categoryName} • 
                      Purchased {new Date(license.createdAt).toLocaleDateString()}
                    </p>
                    
                    <div className="bg-muted p-3 rounded font-mono text-sm flex items-center justify-between">
                      <span className="break-all">{license.key}</span>
                      <button
                        onClick={() => copyToClipboard(license.key, license.id)}
                        className="ml-3 text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                        title="Copy license key"
                      >
                        {copiedKey === license.id ? (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {license.activatedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last activated: {new Date(license.activatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {license.product.downloadUrl && (
                      <a
                        href={license.product.downloadUrl}
                        className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    )}
                    <Link
                      href={`/products/${license.product.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {licenses.length === 0 && (
              <div className="text-center py-12">
                <svg className="h-12 w-12 mx-auto mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0a2 2 0 01-2 2m2-2h-6m6 0a2 2 0 002 2m-2-2v6m0 0a2 2 0 01-2 2m0 0H9m6 0V9a2 2 0 00-2-2m-2 2v6m0 0a2 2 0 01-2 2H9" />
                </svg>
                <h3 className="text-lg font-medium mb-2">No licenses yet</h3>
                <p className="text-muted-foreground mb-6">
                  Purchase software to get your first license key.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Order History</h2>
            <p className="text-muted-foreground">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card border rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.id.slice(-8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                      {order.tax > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Subtotal: {formatPrice(order.amount)} + Tax: {formatPrice(order.tax)}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : order.status === 'PENDING'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded bg-background">
                      <div>
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.price)}</p>
                </div>
                  ))}
                </div>
                </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-12">
                <svg className="h-12 w-12 mx-auto mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start shopping to see your order history here.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}