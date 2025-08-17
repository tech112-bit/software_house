import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';

// Rate limit configuration for profile updates
const PROFILE_RATE_LIMIT = 5; // 5 requests
const PROFILE_RATE_WINDOW = 60 * 1000; // per minute

export async function PUT(req: NextRequest) {
  // Apply rate limiting
  const ip = getClientIP(req);
  const result = rateLimit(`profile:${ip}`, PROFILE_RATE_LIMIT, PROFILE_RATE_WINDOW);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  try {
    // Get authenticated user session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const { name } = await req.json();
    
    // Validate input
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim().slice(0, 100) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}