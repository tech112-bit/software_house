import Link from 'next/link';

async function getOrder(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/orders/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Order Detail</h1>
        <p>Order not found.</p>
        <Link href="/admin/orders" className="text-blue-600 underline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <Link href="/admin/orders" className="text-blue-600 underline">Back</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded border p-4">
            <div className="font-semibold mb-2">Items</div>
            <ul className="space-y-2">
              {order.items?.map((item: { id: string; quantity: number; price: number; product?: { name: string } }) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name} × {item.quantity}</span>
                  <span>${item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">Customer</div>
            <div className="text-sm">{order.user?.name} ({order.user?.email})</div>
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">Status</div>
            <div className="text-sm font-medium">{order.status}</div>
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-gray-500">Created</div>
            <div className="text-sm">{new Date(order.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}