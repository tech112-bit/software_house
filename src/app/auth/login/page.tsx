'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get callback URL from search params
    const callback = searchParams.get('callbackUrl');
    setCallbackUrl(callback);
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      const sessionData = await getSession();
      if (sessionData) {
        setSession(sessionData);
        setIsAuthenticated(true);
        
        // Auto-redirect if there's a valid callback URL
        if (callback && callback !== '/' && !callback.startsWith('/auth/')) {
          console.log('🎯 LOGIN PAGE: Auto-redirecting to:', callback);
          router.push(callback);
        }
      }
    };
    
    checkAuth();
  }, [searchParams, router]);

  // Auto-redirect admin users to admin dashboard after successful login
  useEffect(() => {
    if (isAuthenticated && session) {
      const userRole = (session?.user as any)?.role?.toString().toLowerCase();
      const isAdmin = userRole === 'admin' || userRole === 'administrator';
      
      if (isAdmin) {
        console.log('🎯 LOGIN PAGE: Admin user on success page, auto-redirecting to admin dashboard');
        const timer = setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000); // 2 second delay to show success message
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        // Get fresh session data
        const sessionData = await getSession();
        setSession(sessionData);
        setIsAuthenticated(true);
        
        // Check if user is admin and auto-redirect accordingly
        const userRole = (sessionData?.user as any)?.role?.toString().toLowerCase();
        const isAdmin = userRole === 'admin' || userRole === 'administrator';
        
        if (isAdmin) {
          console.log('🎯 LOGIN PAGE: Admin user detected, redirecting to admin dashboard');
          // Auto-redirect admin users to admin dashboard
          router.push('/admin/dashboard');
        } else if (callbackUrl && callbackUrl !== '/' && !callbackUrl.startsWith('/auth/')) {
          console.log('🎯 LOGIN PAGE: Regular user, redirecting to callback URL:', callbackUrl);
          router.push(callbackUrl);
        } else {
          console.log('🎯 LOGIN PAGE: Regular user, redirecting to home');
          router.push('/');
        }
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If user is authenticated, show success page
  if (isAuthenticated && session) {
    // Check if user is admin
    const userRole = (session?.user as any)?.role?.toString().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'administrator';
    
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h1>
          <p className="text-gray-600 mb-6">
            You are now logged in as <strong>{session.user?.email}</strong>
            {isAdmin && (
              <span className="block mt-2 text-blue-600 font-semibold">👑 Admin User</span>
            )}
          </p>

          {/* Debug Info */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Status:</strong> authenticated</p>
              <p><strong>Session:</strong> Yes</p>
              <p><strong>User ID:</strong> {session.user?.id}</p>
              <p><strong>User Email:</strong> {session.user?.email}</p>
              <p><strong>User Role:</strong> {session.user?.role}</p>
              <p><strong>Callback URL:</strong> {callbackUrl ? `http://localhost:3001${callbackUrl}` : 'None'}</p>
              <p><strong>Current Path:</strong> /auth/login</p>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Where would you like to go?</h3>
            
            {isAdmin ? (
              // Admin-specific navigation
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    console.log('🎯 LOGIN PAGE: Admin user clicking admin dashboard button');
                    router.push('/admin/dashboard');
                  }}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  🛡️ Go to Admin Dashboard
                </button>
                
                <button 
                  onClick={() => {
                    console.log('🎯 LOGIN PAGE: Admin user clicking admin products button');
                    router.push('/admin/products');
                  }}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  📦 Manage Products
                </button>
                
                <button 
                  onClick={() => {
                    console.log('🎯 LOGIN PAGE: Admin user clicking admin orders button');
                    router.push('/admin/orders');
                  }}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  📋 Manage Orders
                </button>
                
                <button 
                  onClick={() => {
                    console.log('🎯 LOGIN PAGE: Admin user clicking home button');
                    router.push('/');
                  }}
                  className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  🏠 Go to Home
                </button>
              </div>
            ) : (
              // Regular user navigation
              <>
                {callbackUrl && callbackUrl !== '/' && !callbackUrl.startsWith('/auth/') ? (
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        console.log('🎯 LOGIN PAGE: User clicked to go to callbackUrl:', callbackUrl);
                        router.push(callbackUrl);
                      }}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      🚀 Go to {callbackUrl}
                    </button>
                    
                    <button 
                      onClick={() => {
                        console.log('🎯 LOGIN PAGE: User clicked to go to downloads');
                        router.push('/downloads');
                      }}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      📥 Go to Downloads
                    </button>
                    
                    <button 
                      onClick={() => {
                        console.log('🎯 LOGIN PAGE: User clicked to go to account');
                        router.push('/account');
                      }}
                      className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      👤 Go to Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        console.log('🎯 LOGIN PAGE: User clicked to go to downloads');
                        router.push('/downloads');
                      }}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      📥 Go to Downloads
                    </button>
                    
                    <button 
                      onClick={() => {
                        console.log('🎯 LOGIN PAGE: User clicked to go to account');
                        router.push('/account');
                      }}
                      className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      👤 Go to Account
                    </button>
                    
                    <button 
                      onClick={() => {
                        console.log('🎯 LOGIN PAGE: User clicked to go home');
                        router.push('/');
                      }}
                      className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      🏠 Go to Home
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Auto-redirect notice */}
          <div className="text-center text-sm text-gray-500 mt-4">
            {isAdmin ? (
              <p>Redirecting to Admin Dashboard in 2 seconds...</p>
            ) : (
              <>
                <p>If automatic redirect doesn't work, use the buttons above.</p>
                <p>This ensures you can access your account and downloads.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SoftwareCo
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            {callbackUrl?.includes("/cart") ? "Sign in to complete your purchase" : "Sign in to access your account"}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg backdrop-blur-sm">
          <div className="space-y-6">

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                        error 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-border focus:border-blue-500 focus:ring-blue-500/20'
                      } focus:ring-4 focus:outline-none`}
                      placeholder="Enter your email"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-200 ${
                        error 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-border focus:border-blue-500 focus:ring-blue-500/20'
                      } focus:ring-4 focus:outline-none`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: callbackUrl || '/' })}
                className="flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-xl hover:bg-accent transition-colors duration-200"
                disabled={isLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={() => signIn("facebook", { callbackUrl: callbackUrl || '/' })}
                className="flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-xl hover:bg-accent transition-colors duration-200"
                disabled={isLoading}
              >
                <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/sign" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Create Account
            </Link>
          </p>
          <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}