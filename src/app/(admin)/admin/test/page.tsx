import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminTestPage() {
  const session = await auth();
  
  console.log('🧪 ADMIN TEST: Session:', session);
  console.log('🧪 ADMIN TEST: User role:', session?.user?.role);
  
  // Simple admin check
  const userRole = session?.user?.role?.toString().toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrator';
  
  if (!session?.user || !isAdmin) {
    console.log('❌ ADMIN TEST: Access denied');
    redirect('/auth/login');
  }
  
  console.log('✅ ADMIN TEST: Access granted');
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Test Page</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p><strong>✅ Success!</strong> You have admin access!</p>
        <p><strong>User:</strong> {session.user.email}</p>
        <p><strong>Role:</strong> {session.user.role}</p>
        <p><strong>ID:</strong> {session.user.id}</p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Available Admin Routes:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><a href="/admin/dashboard" className="text-blue-600 hover:underline">Dashboard</a></li>
          <li><a href="/admin/products" className="text-blue-600 hover:underline">Products</a></li>
          <li><Link href="/admin/orders" className="text-blue-600 hover:underline">Orders</Link></li>
          <li><a href="/admin/users" className="text-blue-600 hover:underline">Users</a></li>
          <li><a href="/admin/analytics" className="text-blue-600 hover:underline">Analytics</a></li>
          <li><a href="/admin/settings" className="text-blue-600 hover:underline">Settings</a></li>
        </ul>
      </div>
    </div>
  );
}
