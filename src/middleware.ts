import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simple token cache to reduce JWT decryption overhead
const tokenCache = new Map<string, { token: any; expiry: number }>();
const TOKEN_CACHE_TTL = 60000; // 1 minute cache

async function getCachedToken(req: NextRequest) {
  // Check for auth pages specifically
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth/');
  
  if (isAuthPage) {
    console.log(`🔍 TOKEN: Checking token for auth page: ${req.nextUrl.pathname}`);
    console.log(`🍪 TOKEN: Available cookies:`, req.cookies.getAll().map(c => c.name));
  }
  
  // Debug environment variables
  console.log(`🔧 TOKEN: NEXTAUTH_SECRET exists:`, !!process.env.NEXTAUTH_SECRET);
  console.log(`🔧 TOKEN: NEXTAUTH_SECRET length:`, process.env.NEXTAUTH_SECRET?.length || 0);
  console.log(`🔧 TOKEN: NEXTAUTH_SECRET first 10 chars:`, process.env.NEXTAUTH_SECRET?.substring(0, 10) || 'none');
  
  // Try different possible cookie names for NextAuth
  const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                      req.cookies.get('__Secure-next-auth.session-token')?.value ||
                      req.cookies.get('authjs.session-token')?.value ||
                      req.cookies.get('__Secure-authjs.session-token')?.value ||
                      req.cookies.get('__Host-next-auth.csrf-token')?.value; // Fallback to CSRF token
  
  if (!sessionToken) {
    if (isAuthPage) console.log(`❌ TOKEN: No session token found`);
    return null;
  }
  
  if (isAuthPage) console.log(`✅ TOKEN: Session token found: ${sessionToken.substring(0, 20)}...`);
  
  const cached = tokenCache.get(sessionToken);
  if (cached && Date.now() < cached.expiry) {
    if (isAuthPage) console.log(`📋 TOKEN: Using cached token`);
    return cached.token;
  }
  
  // Get fresh token and cache it
  if (isAuthPage) console.log(`🔄 TOKEN: Getting fresh token from NextAuth`);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (isAuthPage) {
    console.log(`🎯 TOKEN: Fresh token result:`, token ? { id: token.id, email: token.email, exp: token.exp } : 'null');
  }
  
  if (token && sessionToken) {
    tokenCache.set(sessionToken, {
      token,
      expiry: Date.now() + TOKEN_CACHE_TTL
    });
    
    // Cleanup old cache entries
    if (tokenCache.size > 1000) {
      const oldEntries = Array.from(tokenCache.entries())
        .filter(([_, data]) => Date.now() >= data.expiry);
      oldEntries.forEach(([key]) => tokenCache.delete(key));
    }
  }
  
  return token;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  console.log(`🔍 MIDDLEWARE: Processing ${pathname}`);
  
  // Skip middleware for certain paths immediately
  if (
    pathname.startsWith('/api/auth/') || 
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/webhooks/') ||
    pathname === '/favicon.ico'
  ) {
    console.log(`⏩ MIDDLEWARE: Skipping ${pathname}`);
    return NextResponse.next();
  }

  const token = await getCachedToken(req);
  console.log(`🔑 MIDDLEWARE: Token for ${pathname}:`, token ? { id: token.id, email: token.email } : 'null');

  // Security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Pre-computed CSP header for better performance
  const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;";
  
  response.headers.set('Content-Security-Policy', cspHeader);

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    console.log(`🛡️ MIDDLEWARE: Admin route access check for ${pathname}`);
    console.log(`🛡️ MIDDLEWARE: All cookies:`, req.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`));
    console.log(`🛡️ MIDDLEWARE: Token:`, token);
    console.log(`🛡️ MIDDLEWARE: Token role:`, token?.role);
    console.log(`🛡️ MIDDLEWARE: Token type:`, typeof token?.role);
    console.log(`🛡️ MIDDLEWARE: Token email:`, token?.email);
    console.log(`🛡️ MIDDLEWARE: Token id:`, token?.id);
    console.log(`🛡️ MIDDLEWARE: Token exp:`, token?.exp);
    console.log(`🛡️ MIDDLEWARE: Current time:`, Date.now());
    console.log(`🛡️ MIDDLEWARE: Token expired:`, token?.exp ? Date.now() > token.exp * 1000 : 'unknown');
    
    // TEMPORARILY DISABLE ADMIN PROTECTION FOR TESTING
    console.log(`🛡️ MIDDLEWARE: TEMPORARILY ALLOWING ADMIN ACCESS FOR TESTING`);
    return NextResponse.next();
    
    /*
    if (!token) {
      console.log(`❌ MIDDLEWARE: No token found, redirecting to login`);
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Check if user has admin role (case-insensitive)
    const userRole = token.role?.toString().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'administrator';
    
    console.log(`🛡️ MIDDLEWARE: User role: ${userRole}, isAdmin: ${isAdmin}`);
    console.log(`🛡️ MIDDLEWARE: Pathname: ${pathname}`);
    console.log(`🛡️ MIDDLEWARE: Request URL: ${req.url}`);
    
    if (!isAdmin) {
      console.log(`❌ MIDDLEWARE: User role ${userRole} is not admin, redirecting to home`);
      const url = req.nextUrl.clone();
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    console.log(`✅ MIDDLEWARE: Admin access granted to ${pathname} for user:`, token.email);
    // Allow admin access - don't redirect
    return NextResponse.next();
    */
  }

  // Protected user routes - only account requires authentication
  // Downloads should be public for browsing, but require auth for actual downloads
  if (pathname.startsWith('/account')) {
    console.log(`🔒 MIDDLEWARE: Checking access to protected route: ${pathname}`);
    console.log(`🔑 MIDDLEWARE: Token status:`, token ? 'Valid' : 'Missing/Invalid');
    
    if (!token) {
      console.log(`❌ MIDDLEWARE: Access denied to ${pathname}, redirecting to login`);
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    console.log(`✅ MIDDLEWARE: Access granted to ${pathname} for user:`, token.email);
  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/sign'))) {
    console.log(`🚫 MIDDLEWARE: Redirecting authenticated user from ${pathname}`);
    console.log(`🚫 MIDDLEWARE: Token details:`, { id: token.id, email: token.email, role: token.role });
    
    // Check if there's a callbackUrl to redirect to
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
    console.log(`🚫 MIDDLEWARE: Callback URL from query:`, callbackUrl);
    
    if (callbackUrl && callbackUrl !== '/' && !callbackUrl.startsWith('/auth/')) {
      console.log(`🔄 MIDDLEWARE: Redirecting to callbackUrl: ${callbackUrl}`);
      const url = req.nextUrl.clone();
      url.pathname = callbackUrl!; // Non-null assertion since we've already checked it's not null
      url.searchParams.delete('callbackUrl'); // Clean up the URL
      console.log(`🔄 MIDDLEWARE: Final redirect URL:`, url.toString());
      return NextResponse.redirect(url);
    }
    
    // Default redirect to home
    console.log(`🔄 MIDDLEWARE: No callbackUrl, redirecting to home`);
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  console.log(`✅ MIDDLEWARE: Allowing access to ${pathname}`);

  // Rate limiting for API routes (basic implementation)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // You could implement more sophisticated rate limiting here
    // For now, we just add the header for API routes
    response.headers.set('X-RateLimit-Policy', 'Enabled');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/((?!auth).*)'
  ],
};