import Link from 'next/link';

export default function AdminSimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Simple Test</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p><strong>✅ Success!</strong> You can access admin routes!</p>
        <p>This page has no authentication checks - if you can see this, the routing is working.</p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Next Steps:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><a href="/admin/dashboard" className="text-blue-600 hover:underline">Try Dashboard (with auth)</a></li>
          <li><a href="/admin/test" className="text-blue-600 hover:underline">Try Test Page (with auth)</a></li>
          <li><Link href="/" className="text-blue-600 hover:underline">Go Home</Link></li>
        </ul>
      </div>
    </div>
  );
}
