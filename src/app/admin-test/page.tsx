export default function AdminTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              ✅ Admin Test Page - No Authentication Required
            </h1>
            <p className="text-lg text-gray-600">
              This page is accessible without any authentication checks.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Success!</h3>
            <p className="text-green-700">
              If you can see this page, the basic admin routing is working correctly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">🔍 What This Means</h3>
              <p className="text-blue-700 text-sm">
                The issue is likely with the authentication system, not the routing itself.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Next Steps</h3>
              <p className="text-yellow-700 text-sm">
                We need to fix the authentication system to make the real admin panel work.
              </p>
            </div>
          </div>

          <div className="text-center space-y-3">
            <a 
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Home
            </a>
            
            <a 
              href="/auth/login"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors ml-3"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
