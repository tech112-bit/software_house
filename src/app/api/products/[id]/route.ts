import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limiter'

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('🔍 PRODUCT DELETE API: Starting DELETE request');
    
    const session = await auth()
    console.log('🔍 PRODUCT DELETE API: Session:', session ? 'exists' : 'null');
    console.log('🔍 PRODUCT DELETE API: User role:', session?.user?.role);
    
    if (!session || !isAdminUser(session.user)) {
      console.log('🔍 PRODUCT DELETE API: Auth failed - returning 401');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    // Re-enable CSRF validation with proper token system
    if (!validateCsrf(req)) {
      console.log('🔍 PRODUCT DELETE API: CSRF validation failed');
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }
    console.log('🔍 PRODUCT DELETE API: CSRF validation passed');

    const ip = getClientIP(req)
    const limit = rateLimit(`products:DELETE:${ip}`, 10, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params
    console.log('🔍 PRODUCT DELETE API: Deleting product with ID:', id);

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      console.log('🔍 PRODUCT DELETE API: Product not found');
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id },
    })

    console.log('🔍 PRODUCT DELETE API: Product deleted successfully');
    const res = NextResponse.json({ message: 'Product deleted successfully' })
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('🔍 PRODUCT DELETE API: Error deleting product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('🔍 PRODUCT UPDATE API: Starting PUT request');
    
    const session = await auth()
    console.log('🔍 PRODUCT UPDATE API: Session:', session ? 'exists' : 'null');
    console.log('🔍 PRODUCT UPDATE API: User role:', session?.user?.role);
    
    if (!session || !isAdminUser(session.user)) {
      console.log('🔍 PRODUCT UPDATE API: Auth failed - returning 401');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    // Re-enable CSRF validation with proper token system
    if (!validateCsrf(req)) {
      console.log('🔍 PRODUCT UPDATE API: CSRF validation failed');
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
    }
    console.log('🔍 PRODUCT UPDATE API: CSRF validation passed');

    const ip = getClientIP(req)
    const limit = rateLimit(`products:PUT:${ip}`, 10, 60000)
    if (!limit.success) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params
    const body = await req.json()
    console.log('🔍 PRODUCT UPDATE API: Request body:', body);
    
    const { name, description, price, category, images } = body as {
      name?: string
      description?: string
      price?: number
      category?: string
      images?: string[]
    }

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      console.log('🔍 PRODUCT UPDATE API: Product not found');
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    const cleanName = typeof name === 'string' ? name.slice(0, 120) : product.name
    const cleanDescription = typeof description === 'string' ? description.slice(0, 2000) : product.description
    const cleanCategory = typeof category === 'string' ? category.slice(0, 60) : product.categoryName
    const cleanImages = Array.isArray(images)
      ? JSON.stringify(images.filter((u) => typeof u === 'string').slice(0, 20))
      : product.images

    console.log('🔍 PRODUCT UPDATE API: Updating product with data:', {
      name: cleanName,
      description: cleanDescription,
      price: typeof price === 'number' ? price : product.price,
      images: cleanImages,
      categoryName: cleanCategory,
    });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: cleanName,
        description: cleanDescription,
        price: typeof price === 'number' ? price : product.price,
        images: cleanImages,
        categoryName: cleanCategory,
      },
    })

    console.log('🔍 PRODUCT UPDATE API: Product updated successfully');
    const res = NextResponse.json(updatedProduct)
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining))
    res.headers.set('X-RateLimit-Reset', String(limit.resetTime))
    return res
  } catch (error) {
    console.error('🔍 PRODUCT UPDATE API: Error updating product:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}