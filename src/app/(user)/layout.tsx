import Link from 'next/link';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <main className="container mx-auto p-8">
        {children}
      </main>
    </div>
  );
}