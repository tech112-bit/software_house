"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CartNavLink from './CartNavLink';
import UserNav from './UserNav';

interface AdminAwareNavigationProps {
  session: any;
}

export default function AdminAwareNavigation({ session }: AdminAwareNavigationProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdmin = (session?.user as any)?.role?.toString().toLowerCase() === 'admin';

  return (
    <>
      {/* Admin Mode Indicator */}
      {isAdmin && isAdminRoute && (
        <div className="hidden md:flex items-center space-x-2 mr-4">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <span>🛡️</span>
            <span>ADMIN MODE</span>
          </div>
        </div>
      )}
      
      {/* Navigation Links - Show different content for admin vs public */}
      <div className="hidden md:flex items-center space-x-8">
        {isAdmin && isAdminRoute ? (
          // Admin Navigation
          <>
            <Link href="/admin/dashboard" className="text-foreground/70 hover:text-foreground transition-colors font-medium flex items-center space-x-1">
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link href="/admin/products" className="text-foreground/70 hover:text-foreground transition-colors font-medium flex items-center space-x-1">
              <span>📦</span>
              <span>Products</span>
            </Link>
            <Link href="/admin/orders" className="text-foreground/70 hover:text-foreground transition-colors font-medium flex items-center space-x-1">
              <span>🛒</span>
              <span>Orders</span>
            </Link>
            <Link href="/admin/users" className="text-foreground/70 hover:text-foreground transition-colors font-medium flex items-center space-x-1">
              <span>👥</span>
              <span>Users</span>
            </Link>
            <Link href="/admin/analytics" className="text-foreground/70 hover:text-foreground transition-colors font-medium flex items-center space-x-1">
              <span>📈</span>
              <span>Analytics</span>
            </Link>
            <Link href="/" className="text-red-600 hover:text-red-700 transition-colors font-medium flex items-center space-x-1 border border-red-300 px-3 py-1 rounded-lg hover:bg-red-50">
              <span>🚪</span>
              <span>Exit Admin</span>
            </Link>
          </>
        ) : (
          // Public Navigation
          <>
            <Link href="/" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Home</Link>
            <Link href="/products" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Products</Link>
            <Link href="/downloads" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Downloads</Link>
            {isAdmin && (
              <Link href="/admin/dashboard" className="text-foreground/70 hover:text-foreground transition-colors font-medium flex items-center space-x-1">
                <span>🛡️</span>
                <span>Admin</span>
              </Link>
            )}
          </>
        )}
      </div>
      
      {/* Right side navigation - Hide cart in admin areas */}
      <div className="flex items-center space-x-4">
        {(!isAdmin || !isAdminRoute) && <CartNavLink />}
        <UserNav />
      </div>
    </>
  );
}
