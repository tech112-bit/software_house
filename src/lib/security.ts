import crypto from 'crypto';

// Input validation and sanitization utilities

export function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  
  // Remove potential XSS attempts
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
  
  return sanitized.slice(0, maxLength);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be no longer than 128 characters');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePrice(price: number): boolean {
  return typeof price === 'number' && price >= 0 && price <= 99999.99 && !isNaN(price);
}

export function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 100;
}

export function sanitizeFileName(fileName: string): string {
  // Remove dangerous characters from file names
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

// CSRF token utilities
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
}

// API request validation
export interface APIValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export function validateProductData(data: any): APIValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Product name is required');
  } else {
    sanitizedData.name = sanitizeString(data.name, 120);
    if (sanitizedData.name.length < 2) {
      errors.push('Product name must be at least 2 characters long');
    }
  }

  // Description validation
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Product description is required');
  } else {
    sanitizedData.description = sanitizeString(data.description, 2000);
    if (sanitizedData.description.length < 10) {
      errors.push('Product description must be at least 10 characters long');
    }
  }

  // Price validation
  if (typeof data.price !== 'number' || !validatePrice(data.price)) {
    errors.push('Valid price is required (0-99999.99)');
  } else {
    sanitizedData.price = data.price;
  }

  // Category validation
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Product category is required');
  } else {
    sanitizedData.category = sanitizeString(data.category, 60);
  }

  // Images validation (optional)
  if (data.images) {
    if (Array.isArray(data.images)) {
      sanitizedData.images = data.images
        .filter((img: any) => typeof img === 'string')
        .map((img: any) => sanitizeString(img, 500))
        .slice(0, 10); // Max 10 images
    } else {
      errors.push('Images must be an array of URLs');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
}

export function validateOrderData(data: any): APIValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Items validation
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    const validItems = [];
    for (const item of data.items) {
      if (typeof item.id === 'string' && validateQuantity(item.quantity)) {
        validItems.push({
          id: sanitizeString(item.id, 50),
          quantity: item.quantity
        });
      }
    }
    
    if (validItems.length === 0) {
      errors.push('No valid items found in order');
    } else {
      sanitizedData.items = validItems;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
}

// IP address utilities
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export function sanitizeIP(ip: string): string {
  if (!ip || typeof ip !== 'string') return 'unknown';
  
  // Extract IP from X-Forwarded-For header format
  const cleanIP = ip.split(',')[0].trim();
  
  return isValidIP(cleanIP) ? cleanIP : 'unknown';
}

// User agent sanitization
export function sanitizeUserAgent(userAgent: string): string {
  if (!userAgent || typeof userAgent !== 'string') return 'unknown';
  
  return sanitizeString(userAgent, 500);
}

// Audit logging interface
export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: any;
}

export function createAuditLog(entry: Omit<AuditLogEntry, 'timestamp'>): AuditLogEntry {
  return {
    ...entry,
    timestamp: new Date(),
    ipAddress: sanitizeIP(entry.ipAddress),
    userAgent: sanitizeUserAgent(entry.userAgent),
  };
}
