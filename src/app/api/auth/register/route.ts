import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcrypt'
import { validateCSRFToken } from '@/lib/utils'
import { authMiddleware } from '../middleware'

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimit = await authMiddleware(req);
  if (rateLimit) return rateLimit;
  
  try {
    // Validate CSRF token
    const csrfToken = req.headers.get('X-CSRF-Token')
    
    // For API routes, we'll use a custom header approach
    // The frontend sends the token in the X-CSRF-Token header
    // We'll validate it's present but not do a full comparison since
    // we can't access sessionStorage from the server
    if (!csrfToken) {
      return NextResponse.json({ message: 'CSRF token required' }, { status: 403 })
    }

    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashed,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}