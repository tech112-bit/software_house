import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ licenseId: string }> }
) {
  const { licenseId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIP(req);
    const limit = rateLimit(`downloads:${ip}`, 10, 60000); // 10 downloads per minute
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many download requests' }, { status: 429 });
    }



    // Find the license and verify ownership
    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: session.user.id,
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            downloadUrl: true,
            fileSize: true,
            version: true,
            downloadLimit: true,
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found or inactive' }, { status: 404 });
    }

    // Check if license is expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      return NextResponse.json({ error: 'License has expired' }, { status: 403 });
    }

    // Check if product has a download URL
    if (!license.product.downloadUrl) {
      return NextResponse.json({ error: 'Download not available for this product' }, { status: 404 });
    }

    // Check download limits
    const downloadCount = await prisma.download.count({
      where: {
        userId: session.user.id,
        productId: license.product.id,
        licenseId: license.id,
      },
    });

    const downloadLimit = license.product.downloadLimit || 5;
    if (downloadCount >= downloadLimit) {
      return NextResponse.json({ 
        error: 'Download limit exceeded',
        limit: downloadLimit,
        used: downloadCount,
      }, { status: 403 });
    }

    // Generate secure download URL with expiration (valid for 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const downloadToken = Buffer.from(
      JSON.stringify({
        licenseId: license.id,
        productId: license.product.id,
        userId: session.user.id,
        expiresAt: expiresAt.toISOString(),
      })
    ).toString('base64url');

    // Log the download attempt
    await prisma.download.create({
      data: {
        userId: session.user.id,
        productId: license.product.id,
        licenseId: license.id,
        downloadUrl: `${req.nextUrl.origin}/api/downloads/file/${downloadToken}`,
        expiresAt,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || 'Unknown',
      },
    });

    return NextResponse.json({
      downloadUrl: `${req.nextUrl.origin}/api/downloads/file/${downloadToken}`,
      expiresAt: expiresAt.toISOString(),
      product: {
        name: license.product.name,
        version: license.product.version,
        fileSize: license.product.fileSize,
      },
      downloadInfo: {
        remainingDownloads: downloadLimit - downloadCount - 1,
        totalLimit: downloadLimit,
      },
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
