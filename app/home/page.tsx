"use client"

/* -------   formatting for overall look background etc */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useTranslation } from "@/lib/translation-context"
import type { SupportedLanguage } from "@/lib/translation"
import type { SessionUser } from "@/lib/types"
import { HomeFeed } from "./_components/home-feed"
import { DiscoverFeed } from "./_components/discover-feed"
import { MessagingView } from "./_components/messaging-view"
import { ProfileView } from "./_components/profile-view"
import { PostComposer } from "./_components/post-composer"
import { SuggestedFriendsSidebar } from "./_components/suggested-friends-sidebar"
import { TopLocationsSidebar } from "./_components/top-locations-sidebar"
import { TopStoriesSidebar } from "./_components/top-stories-sidebar"
import { Home, Compass, PlusCircle, MessageCircle, User, LogOut, Globe, Moon, Sun, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { DEMO_MODE_QUERY_PARAM, DEMO_MODE_STORAGE_KEY } from "@/lib/demo-mode"

type View = "home" | "discover" | "messages" | "profile" | "student"

export default function HomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { currentLanguage, setLanguage, supportedLanguages, isTranslating } = useTranslation()
  const [currentView, setCurrentView] = useState<View>("home")
  const [showComposer, setShowComposer] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [feedRefreshToken, setFeedRefreshToken] = useState(0)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoChecked, setDemoChecked] = useState(false)
  const { toast } = useToast()
  const USER_TYPE_STORAGE_KEY = "hb_selected_user_type"

  useEffect(() => {
    if (typeof window === "undefined") return

    const demoParam = new URLSearchParams(window.location.search).get(DEMO_MODE_QUERY_PARAM)

    if (demoParam === "1") {
      setIsDemoMode(true)
      window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "1")
    } else if (demoParam === "0") {
      setIsDemoMode(false)
      window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY)
    } else {
      const stored = window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)
      setIsDemoMode(stored === "1")
    }

    setDemoChecked(true)
  }, [])

  useEffect(() => {
    if (!demoChecked) return

    if (isDemoMode) {
      setAuthChecked(true)
      setSessionUser(null)
      return
    }

    let isMounted = true

    const enforceAuth = async () => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        const hasCodeParam = !!url.searchParams.get("code")
        const hasAccessTokenHash = url.hash.includes("access_token")

        if (hasCodeParam || hasAccessTokenHash) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          )
          if (error) {
            console.error("Auth code exchange failed", error)
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/login")
        return
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY)
      }
      setIsDemoMode(false)

      if (isMounted) {
        const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>
        const displayName =
          (typeof metadata.full_name === "string" && metadata.full_name) ||
          (typeof metadata.name === "string" && metadata.name) ||
          (session.user.email ? session.user.email.split("@")[0] : null)

        const avatarUrl =
          (typeof metadata.avatar_url === "string" && metadata.avatar_url) || null

        setAuthChecked(true)
        setSessionUser({
          id: session.user.id,
          email: session.user.email ?? null,
          displayName: displayName ?? null,
          avatarUrl,
        })
      }
    }

    void enforceAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login")
        setSessionUser(null)
      } else {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY)
        }
        setIsDemoMode(false)

        const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>
        const displayName =
          (typeof metadata.full_name === "string" && metadata.full_name) ||
          (typeof metadata.name === "string" && metadata.name) ||
          (session.user.email ? session.user.email.split("@")[0] : null)

        const avatarUrl =
          (typeof metadata.avatar_url === "string" && metadata.avatar_url) || null

        setAuthChecked(true)
        setSessionUser({
          id: session.user.id,
          email: session.user.email ?? null,
          displayName: displayName ?? null,
          avatarUrl,
        })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [demoChecked, isDemoMode, router, supabase])

  // Apply any pending role selection saved before/at login
  useEffect(() => {
    if (isDemoMode) return

    const applyPendingRole = async () => {
      if (!sessionUser?.id || typeof window === "undefined") return
      const pending = window.localStorage.getItem(USER_TYPE_STORAGE_KEY)
      if (pending !== "student" && pending !== "community") return

      try {
        const res = await fetch(`/api/profiles?userId=${encodeURIComponent(sessionUser.id)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        })
        const body = (await res.json().catch(() => ({}))) as {
          profile?: { user_type?: string | null } | null
        }
        if (res.ok && body.profile?.user_type) {
          window.localStorage.removeItem(USER_TYPE_STORAGE_KEY)
          return
        }

        const patch = await fetch("/api/profiles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: sessionUser.id, userType: pending }),
        })
        if (patch.ok) {
          window.localStorage.removeItem(USER_TYPE_STORAGE_KEY)
        }
      } catch (e) {
        // Silent failure; user can set later from login page if needed
      }
    }

    void applyPendingRole()
  }, [isDemoMode, sessionUser])

  const handleLogout = async () => {
    if (isDemoMode) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY)
      }
      setIsDemoMode(false)
      router.replace(`/login?${DEMO_MODE_QUERY_PARAM}=0`)
      return
    }

    await supabase.auth.signOut()
    setSessionUser(null)
    router.replace("/login")
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-purple-500">Loading your feed...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-300 via-sky-200 to-purple-300 dark:from-purple-900 dark:via-cyan-800 dark:to-purple-900">
      {/* Top Navigation */}
      <nav className="bg-violet-400 dark:bg-violet-800/80 backdrop-blur-md border-b border-violet-100 dark:border-violet-700 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-100 to-violet-300 dark:from-violet-400 dark:to-violet-400 bg-clip-text text-transparent">
            HomeBridgr
          </h1>
          
          <div className="flex items-center gap-4">
            {isDemoMode ? (
              <span className="hidden md:inline text-sm text-sky-100 dark:text-sky-300">
                Demo mode — exploring sample data
              </span>
            ) : (
              sessionUser?.email && (
                <span className="hidden md:inline text-sm text-sky-100 dark:text-sky-300">
                  Signed in as {sessionUser.email}
                </span>
              )
            )}
            {/* Language Selector */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                disabled={isTranslating}
                className="appearance-none bg-purple-50 dark:bg-sky-500 text-purple-500 dark:text-purple-300 px-3 py-2 pr-8 rounded-lg text-sm font-medium border border-purple-200 dark:border-gray-600 hover:bg-purple-100 dark:hover:bg-gray-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {Object.entries(supportedLanguages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <Globe className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300 dark:text-purple-400 pointer-events-none ${isTranslating ? 'animate-spin' : ''}`} />
            </div>

            {/* Messages Button */}
            <button
              onClick={() => setCurrentView("messages")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border relative",
                currentView === "messages"
                  ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700"
                  : "bg-sky-50 dark:bg-gray-700 hover:bg-sky-100 dark:hover:bg-gray-600 text-sky-400 dark:text-sky-300 border-sky-200 dark:border-gray-600"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">Messages</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600 text-purple-400 dark:text-purple-300 p-2 rounded-lg text-sm font-medium transition-colors border border-purple-200 dark:border-gray-600"
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
              className="flex items-center gap-2 bg-sky-50 dark:bg-sky-600/30 hover:bg-sky-100 dark:hover:bg-sky-600/50 text-sky-400 dark:text-sky-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-sky-200 dark:border-sky-800"
            >
              <LogOut className="w-4 h-4" />
              {isDemoMode ? "Exit Demo" : "Logout"}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {isDemoMode && (
          <div className="mx-auto mt-4 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-purple-200 bg-white/70 p-5 text-sm text-purple-700 shadow-sm dark:border-purple-600/60 dark:bg-gray-900/70 dark:text-purple-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">You&apos;re viewing the HomeBridgr demo.</p>
                <button
                  onClick={() => handleLogout()}
                  className="inline-flex items-center justify-center rounded-full border border-purple-300 px-3 py-1 text-xs font-semibold text-purple-600 transition hover:border-purple-400 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-200 dark:hover:bg-purple-800/40"
                >
                  Return to login
                </button>
              </div>
              <p>
                Sample data showcases community posts, discover cards, and messaging. Sign in to see your real feeds, save postcards, and share updates.
              </p>
            </div>
          </div>
        )}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex gap-6 justify-center">
          {/* Left Sidebar - Show on Home and Discover views */}
          {(currentView === "home" || currentView === "discover") && (
            <aside className="hidden lg:block flex-shrink-0">
              <SuggestedFriendsSidebar />
            </aside>
          )}
          
          {/* Main Feed */}
          <div className={(currentView === "home" || currentView === "discover") ? "flex-1 max-w-4xl" : "flex-1 max-w-2xl mx-auto px-4"}>
            {currentView === "home" && (
              <HomeFeed
                key="community-feed"
                refreshToken={feedRefreshToken}
                userType="community"
                viewerId={isDemoMode ? null : sessionUser?.id ?? null}
                isDemo={isDemoMode}
              />
            )}
            {currentView === "discover" && <DiscoverFeed />}
            {currentView === "messages" && <MessagingView />}
            {currentView === "profile" && <ProfileView user={sessionUser} isDemo={isDemoMode} />}
            {currentView === "student" && (
              isDemoMode ? (
                <div className="rounded-3xl border border-dashed border-purple-200 bg-white/70 px-6 py-12 text-center text-purple-700 dark:text-purple-200">
                  Sign in to explore student-only updates curated for your community.
                </div>
              ) : (
              <HomeFeed
                key="student-feed"
                refreshToken={feedRefreshToken}
                userType="student"
                viewerId={sessionUser?.id ?? null}
                title="Student Feed"
                subtitle="Latest updates shared by students"
                emptyTitle="No student posts yet"
                emptyMessage="Encourage students to share what's happening on campus."
              />
              )
            )}
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
            onClick={() => {
              if (isDemoMode) {
                toast({
                  title: "Sign in to view student updates",
                  description: "Create an account to see student-only posts from your community.",
                })
                return
              }
              setCurrentView("student")
            }}
            aria-disabled={isDemoMode}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all",
              currentView === "student" ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
            )}
          >
            <GraduationCap className="w-6 h-6" />
            <span className="text-xs font-medium">Student</span>
          </button>

          <button
            onClick={() => {
              if (isDemoMode) {
                toast({
                  title: "Sign in to share a post",
                  description: "The demo is read-only. Log in to publish updates and upload photos.",
                })
                return
              }
              setShowComposer(true)
            }}
            aria-disabled={isDemoMode}
            className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg hover:shadow-xl transition-all"
          >
            <PlusCircle className="w-7 h-7 text-white" />
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
      {!isDemoMode && showComposer && (
        <PostComposer
          author={sessionUser}
          onClose={() => setShowComposer(false)}
          onPostCreated={() => setFeedRefreshToken((prev) => prev + 1)}
        />
      )}
    </div>
  )
}
