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
    const limit = rateLimit(`licenses:GET:${ip}`, 60, 60000);
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const licenses = await prisma.license.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            version: true,
            categoryName: true,
            downloadUrl: true,
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(licenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIP(req);
    const limit = rateLimit(`licenses:POST:${ip}`, 10, 60000);
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { licenseId, action } = body;

    if (!licenseId || !action) {
      return NextResponse.json({ error: 'License ID and action are required' }, { status: 400 });
    }

    // Find the license and verify ownership
    const license = await prisma.license.findFirst({
      where: {
        id: licenseId,
        userId: session.user.id,
      },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    let updatedLicense;

    switch (action) {
      case 'activate':
        updatedLicense = await prisma.license.update({
          where: { id: licenseId },
          data: {
            isActive: true,
            activatedAt: new Date(),
          },
        });
        break;

      case 'deactivate':
        updatedLicense = await prisma.license.update({
          where: { id: licenseId },
          data: {
            isActive: false,
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(updatedLicense);
  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
