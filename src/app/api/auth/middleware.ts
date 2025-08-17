import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';

// Rate limit configuration for auth endpoints
const AUTH_RATE_LIMIT = 10; // 10 requests
const AUTH_RATE_WINDOW = 60 * 1000; // per minute

/**
 * Authentication middleware that applies rate limiting to auth endpoints
 */
export async function authMiddleware(req: NextRequest) {
  // Get client IP for rate limiting
  const ip = getClientIP(req);
  
  // Apply stricter rate limiting for auth endpoints
  const result = rateLimit(`auth:${ip}`, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW);
  
  if (!result.success) {
    // If rate limit exceeded, return 429 Too Many Requests
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': AUTH_RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
        }
      }
    );
  }
  
  // Continue to the actual handler
  return null;
}