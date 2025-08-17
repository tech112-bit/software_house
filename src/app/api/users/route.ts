import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Helper function to check if user is admin (case-insensitive)
function isAdminUser(user: any): boolean {
  const userRole = user?.role?.toString().toLowerCase();
  return userRole === 'admin' || userRole === 'administrator';
}

// Simple CSRF check using double-submit cookie pattern
function validateCsrf(req: NextRequest) {
  const csrfHeader = req.headers.get('x-csrf-token')
  const csrfCookie = req.cookies.get('csrf-token')?.value
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return false
  }
  return true
}

export async function GET() {
  try {
    const session = await auth()
    // Only admins can list all users
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { email: 'asc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('🔍 USERS API: Starting PUT request');
    
    const session = await auth()
    console.log('🔍 USERS API: Session:', session ? 'exists' : 'null');
    console.log('🔍 USERS API: User role:', session?.user?.role);
    
    if (!session || !isAdminUser(session.user)) {
      console.log('🔍 USERS API: Auth failed - returning 401');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!validateCsrf(req)) {
      console.log('🔍 USERS API: CSRF validation failed');
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }
    console.log('🔍 USERS API: CSRF validation passed');

    const body = await req.json()
    console.log('🔍 USERS API: Request body:', body);
    
    const { id, name, role } = body as { id?: string; name?: string; role?: string }

    if (!id || typeof id !== 'string') {
      console.log('🔍 USERS API: User ID is required');
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (typeof name === 'string') data.name = name.slice(0, 100)
    if (typeof role === 'string' && ['user', 'admin'].includes(role)) data.role = role

    if (Object.keys(data).length === 0) {
      console.log('🔍 USERS API: No valid fields to update');
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 })
    }

    console.log('🔍 USERS API: Updating user with data:', data);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    })

    console.log('🔍 USERS API: User updated successfully');
    return NextResponse.json(updated)
  } catch (error) {
    console.error('🔍 USERS API: Error updating user:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('🔍 USERS API: Starting DELETE request');
    
    const session = await auth()
    console.log('🔍 USERS API: Session:', session ? 'exists' : 'null');
    console.log('🔍 USERS API: User role:', session?.user?.role);
    
    if (!session || !isAdminUser(session.user)) {
      console.log('🔍 USERS API: Auth failed - returning 401');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!validateCsrf(req)) {
      console.log('🔍 USERS API: CSRF validation failed');
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }
    console.log('🔍 USERS API: CSRF validation passed');

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId || typeof userId !== 'string') {
      console.log('🔍 USERS API: User ID is required');
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    console.log('🔍 USERS API: Deleting user with ID:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!user) {
      console.log('🔍 USERS API: User not found');
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      console.log('🔍 USERS API: Admin cannot delete themselves');
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    console.log('🔍 USERS API: User deleted successfully');
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('🔍 USERS API: Error deleting user:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}