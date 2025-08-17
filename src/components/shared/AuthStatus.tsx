'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function AuthStatus() {
  const { data: session, status } = useSession();

  // Log session changes
  useEffect(() => {
    console.log('🔍 AUTH STATUS: Session changed:', { status, session: session ? { email: session.user?.email } : null });
  }, [status, session]);

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-xl z-50 text-sm max-w-sm">
      <div className="font-bold mb-2 text-lg">🔍 Auth Status Debug</div>
      <div className="space-y-2 text-muted-foreground">
        <div>Status: <span className={`font-bold text-lg ${
          status === 'authenticated' ? 'text-green-600' : 
          status === 'unauthenticated' ? 'text-red-600' : 
          'text-yellow-600'
        }`}>{status}</span></div>
        {session && (
          <div className="text-green-700">✅ User: {session.user?.email || 'No email'}</div>
        )}
        {!session && status === 'unauthenticated' && (
          <div className="text-red-700">❌ No session found</div>
        )}
        <div className="flex space-x-2 mt-3 pt-2 border-t">
          <a href="/auth/login" className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Login</a>
          <a href="/auth/sign" className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700">Signup</a>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  );
}
