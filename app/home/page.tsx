"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/translation-context"
import { HomeFeed } from "@/components/home-feed"
import { DiscoverFeed } from "@/components/discover-feed"
import { MessagingView } from "@/components/messaging-view"
import { ProfileView } from "@/components/profile-view"
import { PostComposer } from "@/components/post-composer"
import { SuggestedFriendsSidebar } from "@/components/suggested-friends-sidebar"
import { TopLocationsSidebar } from "@/components/top-locations-sidebar"
import { TopStoriesSidebar } from "@/components/top-stories-sidebar"
import { Home, Compass, PlusCircle, MessageCircle, User, LogOut, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

type View = "home" | "discover" | "messages" | "profile"

export default function HomePage() {
  const router = useRouter()
  const { currentLanguage, setLanguage, supportedLanguages, isTranslating } = useTranslation()
  const [currentView, setCurrentView] = useState<View>("home")
  const [showComposer, setShowComposer] = useState(false)

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            HomeBridgr
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as any)}
                disabled={isTranslating}
                className="appearance-none bg-purple-50 text-purple-700 px-3 py-2 pr-8 rounded-lg text-sm font-medium border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {Object.entries(supportedLanguages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <Globe className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 pointer-events-none ${isTranslating ? 'animate-spin' : ''}`} />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-purple-200">
        <div className="flex items-center justify-around px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView("home")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "home" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
            )}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setCurrentView("discover")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "discover" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
            )}
          >
            <Compass className="w-6 h-6" />
            <span className="text-xs font-medium">Discover</span>
          </button>

          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg hover:shadow-xl transition-all"
          >
            <PlusCircle className="w-7 h-7 text-white" />
          </button>

          <button
            onClick={() => setCurrentView("messages")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative",
              currentView === "messages" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
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
              currentView === "profile" ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
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

