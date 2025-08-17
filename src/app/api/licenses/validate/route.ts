import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';

// Public endpoint for software to validate license keys
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const limit = rateLimit(`license-validate:${ip}`, 30, 60000); // 30 requests per minute
    if (!limit.success) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Too many validation requests' 
      }, { status: 429 });
    }

    const body = await req.json();
    const { licenseKey, productId } = body;

    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json({ 
        valid: false, 
        error: 'License key is required' 
      }, { status: 400 });
    }

    // Find the license
    const license = await prisma.license.findFirst({
      where: {
        key: licenseKey,
        isActive: true,
        ...(productId && { productId }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            version: true,
            isActive: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid license key' 
      });
    }

    // Check if license is expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'License has expired' 
      });
    }

    // Check if product is active
    if (!license.product.isActive) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Product is no longer available' 
      });
    }

    // Check if user account is active
    if (!license.user.isActive) {
      return NextResponse.json({ 
        valid: false, 
        error: 'User account is inactive' 
      });
    }

    // Update last activation time if not recently updated
    const now = new Date();
    const shouldUpdateActivation = !license.activatedAt || 
      (now.getTime() - license.activatedAt.getTime()) > 24 * 60 * 60 * 1000; // 24 hours

    if (shouldUpdateActivation) {
      await prisma.license.update({
        where: { id: license.id },
        data: { activatedAt: now },
      });
    }

    return NextResponse.json({
      valid: true,
      license: {
        id: license.id,
        key: license.key,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
        product: {
          id: license.product.id,
          name: license.product.name,
          version: license.product.version,
        },
      },
    });
  } catch (error) {
    console.error('Error validating license:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
