"use client"

import { useState } from "react"
import Link from "next/link"
import { HomeFeed } from "@/components/home-feed"
import { DiscoverFeed } from "@/components/discover-feed"
import { MessagingView } from "@/components/messaging-view"
import { ProfileView } from "@/components/profile-view"
import { PostComposer } from "@/components/post-composer"

type View = "home" | "discover" | "messages" | "profile"

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [showComposer, setShowComposer] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">HomeBridgr</h1>
          <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
            Logout
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 dashboard-main">
        {currentView === "home" && <HomeFeed />}
        {currentView === "discover" && <DiscoverFeed />}
        {currentView === "messages" && <MessagingView />}
        {currentView === "profile" && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-purple-200">
        <div className="flex items-center justify-around px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView("home")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
              currentView === "home" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
            }`}
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setCurrentView("discover")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
              currentView === "discover" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
            }`}
          >
            <span className="text-2xl">🔍</span>
            <span className="text-xs font-medium">Discover</span>
          </button>

          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full gradient-purple shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-2xl text-white">➕</span>
          </button>

          <button
            onClick={() => setCurrentView("messages")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative ${
              currentView === "messages" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
            }`}
          >
            <span className="text-2xl">💬</span>
            <span className="text-xs font-medium">Messages</span>
            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button
            onClick={() => setCurrentView("profile")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
              currentView === "profile" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
            }`}
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Post Composer Modal */}
      {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
    </div>
  )
}
