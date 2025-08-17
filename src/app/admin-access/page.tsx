import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminAccessPage() {
  const session = await auth();
  
  // Check admin role
  const userRole = session?.user?.role?.toString().toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrator';
  
  if (!session?.user || !isAdmin) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🛡️ Admin Access Portal
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back, <strong>{session.user.name || session.user.email}</strong>!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user.role}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link 
              href="/admin/dashboard"
              className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors text-center group"
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
              <p className="text-blue-100 text-sm">View business overview and statistics</p>
            </Link>

            <Link 
              href="/admin/products"
              className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition-colors text-center group"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-xl font-semibold mb-2">Products</h3>
              <p className="text-green-100 text-sm">Manage software products and inventory</p>
            </Link>

            <Link 
              href="/admin/orders"
              className="bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition-colors text-center"
            >
              <div className="text-4xl mb-3">🛒</div>
              <h3 className="text-xl font-semibold mb-2">Orders</h3>
              <p className="text-purple-100 text-sm">Process and manage customer orders</p>
            </Link>

            <Link 
              href="/admin/users"
              className="bg-orange-600 text-white p-6 rounded-xl hover:bg-orange-700 transition-colors text-center"
            >
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-xl font-semibold mb-2">Users</h3>
              <p className="text-orange-100 text-sm">Manage user accounts and permissions</p>
            </Link>

            <Link 
              href="/admin/analytics"
              className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition-colors text-center"
            >
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-indigo-100 text-sm">View detailed business analytics</p>
            </Link>

            <Link 
              href="/admin/settings"
              className="bg-gray-600 text-white p-6 rounded-xl hover:bg-gray-700 transition-colors text-center"
            >
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-semibold mb-2">Settings</h3>
              <p className="text-gray-100 text-sm">Configure admin panel settings</p>
            </Link>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Access Granted!</h3>
            <p className="text-green-700">
              You have successfully accessed the admin portal. Use the links above to navigate to different admin sections.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
