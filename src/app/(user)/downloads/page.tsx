'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
    fileSize: string | null;
    downloadLimit: number | null;
  };
}

interface Download {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  product: {
    name: string;
    version: string | null;
  };
}

export default function DownloadsPage() {
  const { data: session, status } = useSession();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [licensesRes, downloadsRes] = await Promise.all([
        fetch('/api/licenses'),
        fetch('/api/downloads'),
      ]);

      if (licensesRes.ok) {
        const licensesData = await licensesRes.json();
        setLicenses(licensesData.filter((l: License) => l.product.downloadUrl));
      }

      if (downloadsRes.ok) {
        const downloadsData = await downloadsRes.json();
        setDownloads(downloadsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (licenseId: string) => {
    setDownloadingId(licenseId);
    try {
      const response = await fetch(`/api/downloads/${licenseId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      // Open download in new tab
      window.open(data.downloadUrl, '_blank');
      
      // Refresh data to update download counts
      await fetchData();
    } catch (error) {
      console.error('Download error:', error);
      alert(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border rounded-lg p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
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
          Please sign in to access your downloads.
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

  const activeDownloadableLicenses = licenses.filter(l => l.isActive && l.product.downloadUrl);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Downloads
        </h1>
        <p className="text-muted-foreground">
          Download your purchased software and manage your digital products
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Downloads</p>
              <p className="text-2xl font-bold">{activeDownloadableLicenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{licenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0a2 2 0 01-2 2m2-2h-6m6 0a2 2 0 002 2m-2-2v6m0 0a2 2 0 01-2 2m0 0H9m6 0V9a2 2 0 00-2-2m-2 2v6m0 0a2 2 0 01-2 2H9" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Licenses</p>
              <p className="text-2xl font-bold">{licenses.filter(l => l.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Available Downloads</h2>

        {activeDownloadableLicenses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {activeDownloadableLicenses.map((license) => (
              <div key={license.id} className="bg-card border rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{license.product.name}</h3>
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                        Ready for Download
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                      <div>
                        <span className="font-medium">Version:</span> {license.product.version || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {license.product.categoryName}
                      </div>
                      <div>
                        <span className="font-medium">File Size:</span> {license.product.fileSize || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Download Limit:</span> {license.product.downloadLimit || 'Unlimited'}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>License Key: <code className="bg-muted px-2 py-1 rounded">{license.key}</code></p>
                      <p className="mt-1">
                        Purchased: {new Date(license.createdAt).toLocaleDateString()}
                        {license.expiresAt && (
                          <span className="ml-4">
                            Expires: {new Date(license.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleDownload(license.id)}
                      disabled={downloadingId === license.id}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === license.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Preparing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          Download
                        </span>
                      )}
                    </button>
                    
                    <Link
                      href={`/products/${license.product.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-2 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="h-12 w-12 mx-auto mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No downloads available</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any downloadable products yet. Purchase software to access downloads.
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

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Download Help</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800 dark:text-blue-200 text-sm">
          <div>
            <h4 className="font-medium mb-2">Having trouble downloading?</h4>
            <ul className="space-y-1">
              <li>• Make sure your browser allows downloads</li>
              <li>• Check your download limits</li>
              <li>• Ensure your license is active</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Need support?</h4>
            <ul className="space-y-1">
              <li>• Contact our support team</li>
              <li>• Check the product documentation</li>
              <li>• Visit our help center</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
