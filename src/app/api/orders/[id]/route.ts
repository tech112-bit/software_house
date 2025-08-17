import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limiter'

function validateCsrf(req: NextRequest) {
  const csrfHeader = req.headers.get('x-csrf-token')
  const csrfCookie = req.cookies.get('csrf-token')?.value
  return !!csrfHeader && !!csrfCookie && csrfHeader === csrfCookie
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIP(req)
    const limit = rateLimit(`orders:GET:${ip}`, 60, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && order.userId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const res = NextResponse.json(order)
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    if (!validateCsrf(req)) {
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }

    const ip = getClientIP(req)
    const limit = rateLimit(`orders:PUT:${ip}`, 20, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body as { status?: string }

    if (!status) {
      return NextResponse.json({ message: 'Missing status' }, { status: 400 })
    }

    const allowedStatuses = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED']
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    const current = await prisma.order.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && current.userId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    })

    const res = NextResponse.json(order)
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}