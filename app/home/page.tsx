"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useTranslation } from "@/lib/translation-context"
import { HomeFeed } from "@/components/home-feed"
import { DiscoverFeed } from "@/components/discover-feed"
import { MessagingView } from "@/components/messaging-view"
import { ProfileView } from "@/components/profile-view"
import { PostComposer } from "@/components/post-composer"
import { SuggestedFriendsSidebar } from "@/components/suggested-friends-sidebar"
import { TopLocationsSidebar } from "@/components/top-locations-sidebar"
import { TopStoriesSidebar } from "@/components/top-stories-sidebar"
import { Home, Compass, PlusCircle, MessageCircle, User, LogOut, Globe, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

type View = "home" | "discover" | "messages" | "profile"

export default function HomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { currentLanguage, setLanguage, supportedLanguages, isTranslating } = useTranslation()
  const [currentView, setCurrentView] = useState<View>("home")
  const [showComposer, setShowComposer] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let isMounted = true

    const enforceAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/login")
        return
      }

      if (isMounted) {
        setAuthChecked(true)
      }
    }

    enforceAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login")
      } else {
        setAuthChecked(true)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-purple-600">Loading your feed...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-200 via-purple-300 to-purple-200 dark:from-purple-900 dark:via-cyan-800 dark:to-purple-900">
      {/* Top Navigation */}
      <nav className="bg-purple-400 dark:bg-gray-800/80 backdrop-blur-md border-b border-purple-100 dark:border-gray-700 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-100 to-purple-300 dark:from-purple-400 dark:to-violet-400 bg-clip-text text-transparent">
            HomeBridgr
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as any)}
                disabled={isTranslating}
                className="appearance-none bg-purple-50 dark:bg-gray-700 text-purple-700 dark:text-purple-300 px-3 py-2 pr-8 rounded-lg text-sm font-medium border border-purple-200 dark:border-gray-600 hover:bg-purple-100 dark:hover:bg-gray-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {Object.entries(supportedLanguages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <Globe className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 dark:text-purple-400 pointer-events-none ${isTranslating ? 'animate-spin' : ''}`} />
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600 text-purple-700 dark:text-purple-300 p-2 rounded-lg text-sm font-medium transition-colors border border-purple-200 dark:border-gray-600"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="flex py-6 gap-2 pl-8 pr-8">
          {/* Left Sidebar - Show on Home and Discover views */}
          {(currentView === "home" || currentView === "discover") && (
            <aside className="hidden lg:block flex-shrink-0">
              <SuggestedFriendsSidebar />
            </aside>
          )}
          
          {/* Main Feed */}
          <div className={(currentView === "home" || currentView === "discover") ? "flex-1 max-w-4xl" : "flex-1 max-w-2xl mx-auto px-4"}>
            {currentView === "home" && <HomeFeed />}
            {currentView === "discover" && <DiscoverFeed />}
            {currentView === "messages" && <MessagingView />}
            {currentView === "profile" && <ProfileView />}
          </div>
          
          {/* Right Sidebar - Show on Home view */}
          {currentView === "home" && (
            <aside className="hidden lg:block flex-shrink-0">
              <TopStoriesSidebar />
            </aside>
          )}
          
          {/* Right Sidebar - Show on Discover view */}
          {currentView === "discover" && (
            <aside className="hidden lg:block flex-shrink-0">
              <TopLocationsSidebar />
            </aside>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-purple-200 dark:border-gray-700">
        <div className="flex items-center justify-around px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView("home")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "home" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
            )}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setCurrentView("discover")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "discover" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
            )}
          >
            <Compass className="w-6 h-6" />
            <span className="text-xs font-medium">Discover</span>
          </button>

          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg hover:shadow-xl transition-all"
          >
            <PlusCircle className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={() => setCurrentView("messages")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative",
              currentView === "messages" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
            )}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Messages</span>
            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button
            onClick={() => setCurrentView("profile")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "profile" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
            )}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Post Composer Modal */}
      {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
    </div>
  )
}
