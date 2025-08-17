export default function EnvCheckPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 Environment Variables Check</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium">NEXTAUTH_SECRET:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NEXTAUTH_SECRET ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}
              </span>
              {process.env.NEXTAUTH_SECRET && (
                <span className="text-gray-500 text-xs">
                  Length: {process.env.NEXTAUTH_SECRET.length} chars
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">NEXTAUTH_URL:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NEXTAUTH_URL ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {process.env.NEXTAUTH_URL ? '✅ Set' : '⚠️ Optional'}
              </span>
              {process.env.NEXTAUTH_URL && (
                <span className="text-gray-500 text-xs">
                  Value: {process.env.NEXTAUTH_URL}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">DATABASE_URL:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.DATABASE_URL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
              {process.env.DATABASE_URL && (
                <span className="text-gray-500 text-xs">
                  Type: {process.env.DATABASE_URL.includes('sqlite') ? 'SQLite' : 'Other'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">NODE_ENV:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NODE_ENV ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {process.env.NODE_ENV || 'Not set'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 Troubleshooting Steps</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">1.</span>
              <div>
                <p className="font-medium">Check if you're logged in with the correct admin account:</p>
                <p className="text-gray-600">Email: <code className="bg-gray-100 px-1 rounded">admin@softwareco.com</code></p>
                <p className="text-gray-600">Password: <code className="bg-gray-100 px-1 rounded">admin123</code></p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">2.</span>
              <div>
                <p className="font-medium">Visit the test page to check authentication:</p>
                <a href="/test-auth" className="text-blue-600 hover:underline">/test-auth</a>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">3.</span>
              <div>
                <p className="font-medium">Check browser console for any error messages</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">4.</span>
              <div>
                <p className="font-medium">Check server logs for authentication errors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
