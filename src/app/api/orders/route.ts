import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIP } from '@/lib/rate-limiter'
import { auth } from '@/lib/auth'

function validateCsrf(req: NextRequest) {
  const csrfHeader = req.headers.get('x-csrf-token')
  const csrfCookie = req.cookies.get('csrf-token')?.value
  return !!csrfHeader && !!csrfCookie && csrfHeader === csrfCookie
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIP(req)
    const limit = rateLimit(`orders:GET:${ip}`, 60, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    // Regular users can only see their own orders, admins can see all orders
    const whereClause = session.user.role === 'admin' 
      ? {}
      : { userId: session.user.id };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                version: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const res = NextResponse.json(orders)
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }

    const ip = getClientIP(req)
    const limit = rateLimit(`orders:POST:${ip}`, 10, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const { userId, amount, status = 'PENDING' } = body as {
      userId?: string
      amount?: number
      status?: string
    }

    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Missing or invalid fields' }, { status: 400 })
    }

    // Only allow creating for self unless admin
    if (session.user.role !== 'admin' && userId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const order = await prisma.order.create({
      data: {
        userId,
        amount,
        total: amount, // For now, set total equal to amount (no tax calculation)
        status,
      },
    })

    const res = NextResponse.json(order, { status: 201 })
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}