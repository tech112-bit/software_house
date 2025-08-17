export default function CSSTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-8">
          CSS Connection Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Card 1 - Basic Tailwind */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Basic Tailwind Classes</h2>
            <div className="space-y-4">
              <div className="h-4 bg-blue-500 rounded"></div>
              <div className="h-4 bg-green-500 rounded"></div>
              <div className="h-4 bg-purple-500 rounded"></div>
            </div>
          </div>
          
          {/* Test Card 2 - Custom CSS Variables */}
          <div className="bg-card text-card-foreground rounded-2xl shadow-lg border border-border p-6">
            <h2 className="text-2xl font-semibold mb-4">CSS Custom Properties</h2>
            <div className="space-y-4">
              <div className="h-4 bg-primary rounded"></div>
              <div className="h-4 bg-secondary rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
          
          {/* Test Card 3 - Admin CSS Classes */}
          <div className="admin-card admin-card-hover">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Admin CSS Classes</h2>
            <div className="space-y-4">
              <button className="admin-btn-primary">Primary Button</button>
              <button className="admin-btn-secondary">Secondary Button</button>
            </div>
          </div>
          
          {/* Test Card 4 - Utility Classes */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Utility Classes</h2>
            <div className="space-y-4">
              <div className="text-gradient text-xl font-bold">Gradient Text</div>
              <div className="bg-gradient-hero p-4 rounded-lg">Gradient Background</div>
              <div className="shadow-soft p-4 rounded-lg">Soft Shadow</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              CSS Connection Status
            </h3>
            <p className="text-green-800">
              If you can see this page with proper styling, gradients, and colors, 
              then your CSS connection is working correctly!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
