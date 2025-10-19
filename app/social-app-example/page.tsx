"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HomeFeed } from "./home-feed"
import { DiscoverFeed } from "./discover-feed"
import { MessagingView } from "./messaging-view"
import { ProfileView } from "./profile-view"
import { PostComposer } from "./post-composer"
import { ThemeProvider, useTheme } from "./theme-provider"
import { Moon, Sun, LogOut } from "lucide-react"
import { cn } from "./utils"

type View = "home" | "discover" | "messages" | "profile"

function SocialAppContent() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [showComposer, setShowComposer] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    // Clear any stored theme preference for the social app
    localStorage.removeItem('social-app-theme')
    // Redirect back to the login page
    router.push('/')
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header with Dark Mode Toggle and Logout */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-purple-200 dark:border-gray-700">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">HomeBridgr</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 shadow-lg group"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {currentView === "home" && <HomeFeed />}
        {currentView === "discover" && <DiscoverFeed />}
        {currentView === "messages" && <MessagingView />}
        {currentView === "profile" && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-purple-200 dark:border-gray-700">
        <div className="flex items-center justify-around px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView("home")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "home" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400",
            )}
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setCurrentView("discover")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "discover" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400",
            )}
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
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative",
              currentView === "messages" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400",
            )}
          >
            <span className="text-2xl">💬</span>
            <span className="text-xs font-medium">Messages</span>
            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button
            onClick={() => setCurrentView("profile")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "profile" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400",
            )}
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

export default function SocialAppExample() {
  return (
    <ThemeProvider>
      <SocialAppContent />
    </ThemeProvider>
  )
}
