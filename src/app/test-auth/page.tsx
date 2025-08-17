'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Also try to get session data directly
    const getSessionData = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setSessionData(data);
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    
    getSessionData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NextAuth useSession Hook */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">useSession Hook Data</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> <span className="font-mono">{status}</span></p>
              <p><strong>Session:</strong> {session ? 'Yes' : 'No'}</p>
              {session && (
                <>
                  <p><strong>User ID:</strong> <span className="font-mono">{(session.user as any)?.id || 'None'}</span></p>
                  <p><strong>User Email:</strong> <span className="font-mono">{session.user?.email || 'None'}</span></p>
                  <p><strong>User Role:</strong> <span className="font-mono">{(session.user as any)?.role || 'None'}</span></p>
                  <p><strong>User Name:</strong> <span className="font-mono">{session.user?.name || 'None'}</span></p>
                </>
              )}
            </div>
          </div>

          {/* Direct API Session Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Direct API Session Data</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> <span className="font-mono">{sessionData ? 'Loaded' : 'Loading...'}</span></p>
              {sessionData && (
                <>
                  <p><strong>User ID:</strong> <span className="font-mono">{sessionData.user?.id || 'None'}</span></p>
                  <p><strong>User Email:</strong> <span className="font-mono">{sessionData.user?.email || 'None'}</span></p>
                  <p><strong>User Role:</strong> <span className="font-mono">{sessionData.user?.role || 'None'}</span></p>
                  <p><strong>User Name:</strong> <span className="font-mono">{sessionData.user?.name || 'None'}</span></p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 Debug Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Current URL:</h3>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">{typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Session Status Analysis:</h3>
              <div className="space-y-1 text-sm">
                {status === 'loading' && <p className="text-yellow-600">⏳ Loading session...</p>}
                {status === 'authenticated' && session && (
                  <>
                    <p className="text-green-600">✅ Authenticated</p>
                    <p className="text-green-600">👤 User: {session.user?.email}</p>
                    <p className="text-green-600">🔑 Role: {(session.user as any)?.role || 'None'}</p>
                    {(session.user as any)?.role?.toString().toLowerCase() === 'admin' && (
                      <p className="text-blue-600">👑 Admin User Detected!</p>
                    )}
                  </>
                )}
                {status === 'unauthenticated' && <p className="text-red-600">❌ Not authenticated</p>}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Admin Access Test:</h3>
              <div className="space-y-2">
                <a 
                  href="/admin/dashboard" 
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  🧪 Test Admin Dashboard Access
                </a>
                <br />
                <a 
                  href="/admin/products" 
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  🧪 Test Admin Products Access
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
