import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIP(req);
    const limit = rateLimit(`downloads-list:${ip}`, 30, 60000); // 30 requests per minute
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Get user's download history
    const downloads = await prisma.download.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            version: true,
            downloadUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedDownloads = downloads.map(download => ({
      id: download.id,
      downloadUrl: download.downloadUrl,
      downloadedAt: download.createdAt,
      ipAddress: download.ipAddress,
      userAgent: download.userAgent,
      product: download.product,
      licenseId: download.licenseId,
    }));

    return NextResponse.json(transformedDownloads);
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
