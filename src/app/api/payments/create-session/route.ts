import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import Stripe from 'stripe';

type CartItem = {
  id: string;
  quantity: number;
};

function validateCsrf(req: Request): boolean {
  try {
    const header = req.headers.get('x-csrf-token');
    const cookieHeader = req.headers.get('cookie') || '';
    const cookie = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('csrf-token='));
    const tokenFromCookie = cookie ? cookie.split('=')[1] : undefined;
    return !!header && !!tokenFromCookie && header === tokenFromCookie;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Basic rate limiting by IP + path
    const ip = getClientIP(req);
    const rl = rateLimit(`payments:${ip}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rl.resetTime - Date.now()) / 1000).toString() } }
      );
    }

    // Require authenticated session
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection (double-submit cookie)
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const provider = (body?.provider as string | undefined)?.toLowerCase();
    const rawItems = (body?.items as unknown[] | undefined) ?? [];

    if (!provider) {
      return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
    }
    const allowedProviders = new Set(['stripe', 'paypal', 'razorpay', 'flutterwave']);
    if (!allowedProviders.has(provider)) {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: 'No items to checkout' }, { status: 400 });
    }

    // Validate and normalize items; ignore client-sent price/name
    const items: CartItem[] = [];
    for (const it of rawItems) {
      const item = it as any; // Type assertion for validation
      const id = typeof item?.id === 'string' ? item.id.trim() : '';
      const qtyNum = Number(item?.quantity);
      const quantity = Number.isInteger(qtyNum) ? qtyNum : NaN;
      if (!id || !Number.isFinite(quantity) || quantity < 1 || quantity > 10) {
        return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 });
      }
      items.push({ id, quantity });
    }

    // Sanitize redirect URLs to same origin
    const reqUrl = new URL(req.url);
    const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || reqUrl.origin;
    const sanitizeUrl = (u: string | undefined, fallbackPath: string) => {
      try {
        if (!u) throw new Error('missing');
        const parsed = new URL(u);
        const allowed = new URL(defaultOrigin);
        if (parsed.origin === allowed.origin) return parsed.toString();
      } catch {}
      return new URL(fallbackPath, defaultOrigin).toString();
    };
    const successUrl = sanitizeUrl(body?.successUrl, '/checkout/success');
    const cancelUrl = sanitizeUrl(body?.cancelUrl, '/cart');

    // Load products and compute authoritative prices
    const productIds = [...new Set(items.map((i) => i.id))];
    const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(dbProducts.map((p) => [p.id, p] as const));

    // Ensure all items exist
    for (const it of items) {
      if (!productMap.has(it.id)) {
        return NextResponse.json({ error: `Product not found: ${it.id}` }, { status: 400 });
      }
    }

    if (provider === 'stripe') {
      try {
        // Create line items with proper product data and pricing
        const line_items = items.map((it) => {
          const product = productMap.get(it.id)!;
          const unitAmountCents = formatAmountForStripe(product.price);
          
          return {
            price_data: {
              currency: 'usd',
              product_data: { 
                name: product.name,
                description: product.shortDescription || product.description.substring(0, 100),
                metadata: {
                  product_id: product.id,
                  category: product.categoryName,
                  version: product.version || 'N/A',
                },
              },
              unit_amount: unitAmountCents,
            },
            quantity: it.quantity,
          } as Stripe.Checkout.SessionCreateParams.LineItem;
        });

        // Calculate totals
        const subtotal = items.reduce((sum, it) => {
          const product = productMap.get(it.id)!;
          return sum + (product.price * it.quantity);
        }, 0);

        const params: Stripe.Checkout.SessionCreateParams = {
          mode: 'payment',
          success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: cancelUrl,
          line_items,
          client_reference_id: session.user.id,
          metadata: {
            user_id: session.user.id,
            item_count: items.length.toString(),
            subtotal: subtotal.toString(),
          },
          automatic_tax: {
            enabled: true,
          },
          tax_id_collection: {
            enabled: false,
          },
          payment_intent_data: {
            metadata: {
              user_id: session.user.id,
              order_type: 'software_purchase',
            },
          },
        };

        if (session.user.email) {
          params.customer_email = session.user.email;
        }

        const checkoutSession = await stripe.checkout.sessions.create(params);

        if (!checkoutSession.url) {
          throw new Error('Failed to create checkout session URL');
        }

        return NextResponse.json({ 
          provider: 'stripe', 
          url: checkoutSession.url,
          session_id: checkoutSession.id,
        });
      } catch (stripeError) {
        console.error('Stripe checkout error:', stripeError);
        const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
        return NextResponse.json({
          error: 'Failed to create checkout session',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        }, { status: 500 });
      }
    }

    // Stubs for other providers – replace with real integrations later
    return NextResponse.json({
      provider,
      mode: 'mock',
      url: '/cart?msg=mock_checkout_started',
    });
  } catch (err) {
    console.error('[PAYMENTS_CREATE_SESSION]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}