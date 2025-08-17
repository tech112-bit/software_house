import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoftwareCo - Your Software Marketplace",
  description: "Discover and purchase the best software solutions for your personal and professional needs. Quality guaranteed with instant downloads.",
};

import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { CartProvider } from '@/context/CartContext';
import AdminAwareNavigation from '@/components/shared/AdminAwareNavigation';
import { NotificationProvider } from '@/context/NotificationContext';
import SessionWrapper from '@/components/providers/SessionWrapper';
import { ToastProvider } from '@/components/ui/use-toast';
import { auth } from '@/lib/auth';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <SessionWrapper session={session}>
          <ToastProvider>
            <CartProvider>
              <NotificationProvider>
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
                  <nav className="container mx-auto flex items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center space-x-2 group">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        SoftwareCo
                      </span>
                    </Link>
                    
                    <AdminAwareNavigation session={session} />
                  </nav>
                </header>
                <main className="container mx-auto p-4 flex-grow">{children}</main>
                <Footer />
              </NotificationProvider>
            </CartProvider>
          </ToastProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
