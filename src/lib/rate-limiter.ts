import { sanitizeIP } from './security';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  firstAttempt: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory store with size limits (in production, consider using Redis)
const MAX_STORE_SIZE = 10000; // Limit memory usage
const store = new Map<string, RateLimitInfo>();
const blockedIPs = new Map<string, number>(); // IP -> until timestamp

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean rate limit store
  for (const [key, info] of store.entries()) {
    if (now > info.resetTime) {
      store.delete(key);
    }
  }
  
  // Clean blocked IPs
  for (const [ip, until] of blockedIPs.entries()) {
    if (now > until) {
      blockedIPs.delete(ip);
    }
  }
}, 60000); // Clean every minute

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number; resetTime: number; blocked?: boolean } {
  const now = Date.now();
  const key = identifier;
  
  // Check if IP is temporarily blocked
  const blockedUntil = blockedIPs.get(key);
  if (blockedUntil && now < blockedUntil) {
    return {
      success: false,
      remaining: 0,
      resetTime: blockedUntil,
      blocked: true,
    };
  }
  
  // Clean up expired entries
  if (store.has(key)) {
    const info = store.get(key)!;
    if (now > info.resetTime) {
      store.delete(key);
    }
  }
  
  const current = store.get(key) || { 
    count: 0, 
    resetTime: now + windowMs,
    firstAttempt: now,
  };
  
  if (current.count >= limit && now < current.resetTime) {
    // Check for aggressive behavior (too many requests in short time)
    const timeSinceFirst = now - current.firstAttempt;
    if (current.count > limit * 2 && timeSinceFirst < windowMs / 2) {
      // Block IP for 10 minutes for aggressive behavior
      blockedIPs.set(key, now + 600000);
    }
    
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }
  
  if (now >= current.resetTime) {
    current.count = 1;
    current.resetTime = now + windowMs;
    current.firstAttempt = now;
  } else {
    current.count++;
  }
  
  // Prevent memory exhaustion by limiting store size
  if (store.size >= MAX_STORE_SIZE && !store.has(key)) {
    // Remove oldest entries (LRU-style cleanup)
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }
  
  store.set(key, current);
  
  return {
    success: true,
    remaining: Math.max(0, limit - current.count),
    resetTime: current.resetTime,
  };
}

// Advanced rate limiting with different configs for different scenarios
export function advancedRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number; blocked?: boolean } {
  return rateLimit(identifier, config.limit, config.windowMs);
}

// Specific rate limiters for different use cases
export const rateLimiters = {
  // API endpoints
  api: (identifier: string) => rateLimit(identifier, 100, 60000), // 100 requests per minute
  
  // Authentication attempts
  auth: (identifier: string) => rateLimit(`auth:${identifier}`, 5, 300000), // 5 attempts per 5 minutes
  
  // Password reset requests
  passwordReset: (identifier: string) => rateLimit(`pwd-reset:${identifier}`, 3, 3600000), // 3 attempts per hour
  
  // File downloads
  downloads: (identifier: string) => rateLimit(`downloads:${identifier}`, 10, 60000), // 10 downloads per minute
  
  // License validation
  licenseValidation: (identifier: string) => rateLimit(`license:${identifier}`, 30, 60000), // 30 validations per minute
  
  // Payment processing
  payments: (identifier: string) => rateLimit(`payments:${identifier}`, 5, 300000), // 5 payment attempts per 5 minutes
  
  // Email sending
  emailSending: (identifier: string) => rateLimit(`email:${identifier}`, 10, 3600000), // 10 emails per hour
  
  // Search requests
  search: (identifier: string) => rateLimit(`search:${identifier}`, 50, 60000), // 50 searches per minute
  
  // Admin actions
  adminActions: (identifier: string) => rateLimit(`admin:${identifier}`, 200, 60000), // 200 admin actions per minute
};

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const cfConnecting = req.headers.get('cf-connecting-ip'); // Cloudflare
  const xClientIP = req.headers.get('x-client-ip');
  
  let ip = 'unknown';
  
  if (cfConnecting) {
    ip = cfConnecting;
  } else if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (real) {
    ip = real.trim();
  } else if (xClientIP) {
    ip = xClientIP.trim();
  }
  
  return sanitizeIP(ip);
}

// Block an IP address temporarily
export function blockIP(ip: string, durationMs: number = 3600000): void {
  const cleanIP = sanitizeIP(ip);
  blockedIPs.set(cleanIP, Date.now() + durationMs);
}

// Unblock an IP address
export function unblockIP(ip: string): void {
  const cleanIP = sanitizeIP(ip);
  blockedIPs.delete(cleanIP);
}

// Check if an IP is blocked
export function isIPBlocked(ip: string): boolean {
  const cleanIP = sanitizeIP(ip);
  const blockedUntil = blockedIPs.get(cleanIP);
  return blockedUntil ? Date.now() < blockedUntil : false;
}

// Get rate limit status without incrementing
export function getRateLimitStatus(identifier: string): { 
  remaining: number; 
  resetTime: number; 
  isBlocked: boolean;
} {
  const now = Date.now();
  
  // Check if blocked
  const blockedUntil = blockedIPs.get(identifier);
  if (blockedUntil && now < blockedUntil) {
    return {
      remaining: 0,
      resetTime: blockedUntil,
      isBlocked: true,
    };
  }
  
  const current = store.get(identifier);
  if (!current || now > current.resetTime) {
    return {
      remaining: 10, // Default limit
      resetTime: now,
      isBlocked: false,
    };
  }
  
  return {
    remaining: Math.max(0, 10 - current.count), // Assuming default limit of 10
    resetTime: current.resetTime,
    isBlocked: false,
  };
}

// Enhanced middleware helper
export function createRateLimitMiddleware(
  getLimitConfig: (req: Request) => RateLimitConfig,
  getIdentifier?: (req: Request) => string
) {
  return (req: Request) => {
    const identifier = getIdentifier ? getIdentifier(req) : getClientIP(req);
    const config = getLimitConfig(req);
    
    return advancedRateLimit(identifier, config);
  };
}