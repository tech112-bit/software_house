'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function UserNav() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  if (status === 'loading') {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/auth/login" 
          className="text-foreground/70 hover:text-foreground transition-colors font-medium px-3 py-2 rounded-md hover:bg-accent"
          onClick={() => console.log('Login clicked')}
        >
          Login
        </Link>
        <Link 
          href="/auth/sign" 
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
          onClick={() => console.log('Sign up clicked')}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-medium text-sm">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : session?.user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <span className="hidden md:inline-block">
          {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
        </span>
        <svg 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-foreground/80 border-b border-border">
                <div className="font-medium">{session?.user?.name || 'User'}</div>
                <div className="text-foreground/60">{session?.user?.email}</div>
              </div>
              <Link
                href="/account"
                className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                Account Settings
              </Link>
              <Link
                href="/orders"
                className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                My Orders
              </Link>
              
              {/* Admin Panel Link */}
              {(session?.user as any)?.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors border-t border-border"
                >
                  🛡️ Admin Panel
                </Link>
              )}
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="block w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors border-t border-border"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
