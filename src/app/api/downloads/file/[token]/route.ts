import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Decode and validate the download token
    let tokenData;
    try {
      const decoded = Buffer.from(token, 'base64url').toString();
      tokenData = JSON.parse(decoded);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid download token' }, { status: 400 });
    }

    const { licenseId, productId, userId, expiresAt } = tokenData;

    // Check if token has expired
    if (new Date(expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 });
    }

    // Verify the license and user
    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: userId,
        productId: productId,
        isActive: true,
      },
      include: {
        product: {
          select: {
            name: true,
            downloadUrl: true,
            version: true,
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json({ error: 'Invalid license or download not authorized' }, { status: 403 });
    }

    // Check if license is expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      return NextResponse.json({ error: 'License has expired' }, { status: 403 });
    }

    if (!license.product.downloadUrl) {
      return NextResponse.json({ error: 'Download URL not available' }, { status: 404 });
    }

    // For demo purposes, we'll redirect to the actual download URL
    // In production, you might want to:
    // 1. Stream the file directly from your storage (S3, etc.)
    // 2. Use signed URLs for better security
    // 3. Implement bandwidth limiting
    
    // Log the actual download
    await prisma.download.updateMany({
      where: {
        userId: userId,
        productId: productId,
        licenseId: licenseId,
        downloadUrl: {
          contains: token,
        },
      },
      data: {
        // You could add a downloadedAt timestamp here if needed
      },
    });

    // Return a temporary redirect to the actual file
    // In production, replace this with actual file serving logic
    return NextResponse.redirect(license.product.downloadUrl, 302);

  } catch (error) {
    console.error('Error processing download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
