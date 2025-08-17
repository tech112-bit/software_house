import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIP } from '@/lib/rate-limiter'
import { auth } from '@/lib/auth'

// Helper function to check if user is admin (case-insensitive)
function isAdminUser(user: any): boolean {
  const userRole = user?.role?.toString().toLowerCase();
  return userRole === 'admin' || userRole === 'administrator';
}

function validateCsrf(req: NextRequest) {
  const csrfHeader = req.headers.get('x-csrf-token')
  const csrfCookie = req.cookies.get('csrf-token')?.value
  return !!csrfHeader && !!csrfCookie && csrfHeader === csrfCookie
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req)
    const limit = rateLimit(`products:GET:${ip}`, 60, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    const products = await prisma.product.findMany()

    const res = NextResponse.json(products)
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 PRODUCTS API: Starting POST request');
    
    const session = await auth();
    console.log('🔍 PRODUCTS API: Session:', session ? 'exists' : 'null');
    console.log('🔍 PRODUCTS API: User role:', session?.user?.role);
    
    // Only admins can create products
    if (!session || !isAdminUser(session.user)) {
      console.log('🔍 PRODUCTS API: Auth failed - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Re-enable CSRF validation with proper token system
    if (!validateCsrf(request)) {
      console.log('🔍 PRODUCTS API: CSRF validation failed');
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }
    console.log('🔍 PRODUCTS API: CSRF validation passed');

    const ip = getClientIP(request)
    const limit = rateLimit(`products:POST:${ip}`, 10, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    console.log('🔍 PRODUCTS API: Request body:', body);
    
    const { name, description, price, images, category } = body as {
      name?: string
      description?: string
      price?: number
      images?: string[]
      category?: string
    }

    if (!name || !description || typeof price !== 'number' || !category) {
      console.log('🔍 PRODUCTS API: Missing required fields');
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // sanitize inputs
    const cleanName = String(name).slice(0, 120)
    const cleanDescription = String(description).slice(0, 2000)
    const cleanCategory = String(category).slice(0, 60)
    const cleanImages = Array.isArray(images)
      ? JSON.stringify(images.filter((u) => typeof u === 'string').slice(0, 20))
      : '[]'

    console.log('🔍 PRODUCTS API: Creating category:', cleanCategory);
    await prisma.category.upsert({
      where: { name: cleanCategory },
      update: {},
      create: { name: cleanCategory },
    })

    console.log('🔍 PRODUCTS API: Creating product with data:', {
      name: cleanName,
      description: cleanDescription,
      price,
      images: cleanImages,
      categoryName: cleanCategory,
    });

    const product = await prisma.product.create({
      data: {
        name: cleanName,
        description: cleanDescription,
        price,
        images: cleanImages,
        categoryName: cleanCategory,
      },
    })

    console.log('🔍 PRODUCTS API: Product created successfully:', product.id);
    const res = NextResponse.json(product, { status: 201 })
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('🔍 PRODUCTS API: Error creating product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}