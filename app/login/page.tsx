"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to home page
    router.push("/home")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        {/* Main login card */}
        <div className="bg-white border border-gray-300 px-10 py-8 mb-3">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              HomeBridgr
            </h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-2">
            <input
              type="text"
              placeholder="Phone number, username, or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-sm bg-gray-50 focus:bg-white focus:border-gray-400 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-sm bg-gray-50 focus:bg-white focus:border-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm mt-4 transition-colors"
            >
              Log in
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 font-semibold">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Facebook login */}
          <button className="w-full flex items-center justify-center gap-2 text-blue-900 font-semibold text-sm mb-6">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Log in with Facebook
          </button>

          {/* Forgot password */}
          <a href="#" className="text-xs text-blue-900 flex justify-center">
            Forgot password?
          </a>
        </div>

        {/* Sign up card */}
        <div className="bg-white border border-gray-300 px-10 py-5 text-center">
          <p className="text-sm">
            Don't have an account?{" "}
            <a href="#" className="text-blue-500 font-semibold">
              Sign up
            </a>
          </p>
        </div>

        {/* Get the app */}
        <div className="text-center mt-4">
          <p className="text-sm mb-4">Get the app.</p>
          <div className="flex justify-center gap-2">
            <img
              src="https://static.cdninstagram.com/rsrc.php/v3/yz/r/c5Rp7Ym-Klz.png"
              alt="Get it on Google Play"
              className="h-10"
            />
            <img
              src="https://static.cdninstagram.com/rsrc.php/v3/yu/r/EHY6QnZYdNX.png"
              alt="Get it from Microsoft"
              className="h-10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

