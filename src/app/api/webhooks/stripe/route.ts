import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { generateLicenseKey } from '@/lib/utils';
import { sendOrderConfirmationEmail } from '@/lib/email';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        await handleFailedPayment(paymentIntent);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing successful payment for session:', session.id);

    const userId = session.client_reference_id;
    if (!userId) {
      console.error('No user ID found in session');
      return;
    }

    // Get line items from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    });

    // Create order record
    const order = await prisma.order.create({
      data: {
        userId,
        amount: (session.amount_subtotal || 0) / 100,
        tax: ((session.amount_total || 0) - (session.amount_subtotal || 0)) / 100,
        total: (session.amount_total || 0) / 100,
        status: 'COMPLETED',
        paymentIntentId: session.payment_intent as string,
        paymentStatus: 'paid',
        billingEmail: session.customer_details?.email || '',
        billingName: session.customer_details?.name || '',
        billingAddress: JSON.stringify(session.customer_details?.address || {}),
      },
    });

    // Process each line item
    for (const item of lineItems.data) {
      const productName = (item.price?.product as Stripe.Product)?.name;
      if (!productName) continue;

      // Find the product by name (we stored the product name in Stripe)
      const product = await prisma.product.findFirst({
        where: { name: productName },
      });

      if (!product) {
        console.error(`Product not found: ${productName}`);
        continue;
      }

      // Create order item
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity || 1,
          price: (item.amount_total || 0) / 100,
        },
      });

      // Generate license keys for each quantity
      for (let i = 0; i < (item.quantity || 1); i++) {
        const licenseKey = generateLicenseKey();
        
        await prisma.license.create({
          data: {
            key: licenseKey,
            userId,
            productId: product.id,
            orderId: order.id,
            isActive: true,
          },
        });
      }
    }

    console.log(`Order ${order.id} created successfully with licenses`);

    // Send confirmation email with license keys
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (user?.email) {
        const orderWithItems = await prisma.order.findUnique({
          where: { id: order.id },
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
        });

        const orderLicenses = await prisma.license.findMany({
          where: { orderId: order.id },
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
        });

        if (orderWithItems) {
          // Transform the data to match the email interface
          const transformedOrder = {
            ...orderWithItems,
            tax: orderWithItems.tax || 0,
            createdAt: new Date(orderWithItems.createdAt),
            items: orderWithItems.items.map(item => ({
              ...item,
              product: {
                ...item.product,
                version: item.product.version || undefined, // Convert null to undefined
              },
            })),
          };

          // Transform licenses to match the email interface
          const transformedLicenses = orderLicenses.map(license => ({
            ...license,
            product: {
              ...license.product,
              version: license.product.version || undefined, // Convert null to undefined
              downloadUrl: license.product.downloadUrl || undefined, // Convert null to undefined
            },
          }));

          await sendOrderConfirmationEmail(
            user.email,
            user.name || 'Customer',
            transformedOrder,
            transformedLicenses
          );
          console.log(`Confirmation email sent to ${user.email}`);
        }
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the webhook if email fails
    }

  } catch (error) {
    console.error('Error in handleSuccessfulPayment:', error);
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing failed payment:', paymentIntent.id);
    
    // Find order by payment intent ID and mark as failed
    const order = await prisma.order.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'FAILED',
          paymentStatus: 'failed',
        },
      });
      
      console.log(`Order ${order.id} marked as failed`);
    }
  } catch (error) {
    console.error('Error in handleFailedPayment:', error);
  }
}
