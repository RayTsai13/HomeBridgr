import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🏠 HomeBridgr
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome to your Next.js application with Supabase integration.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/test"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🧪 Test Supabase Connection
          </Link>
          
          <Link 
            href="/public/login"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🔐 Login
          </Link>
          
          <Link 
            href="/public/signup"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ✨ Sign Up
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Built with Next.js 14 & Supabase
          </p>
        </div>
      </div>
    </main>
  )
}