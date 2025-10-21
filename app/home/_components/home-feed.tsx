"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { PostCard } from "./post-card"
import { Postcard } from "./postcard"
import type { Post } from "@/lib/types"
import { fetchPosts } from "@/lib/api/posts"
import { mockPosts } from "@/lib/mock-data"
import { createPostcardCollectionFromPosts } from "@/lib/api/collections"
import { useToast } from "@/hooks/use-toast"

interface HomeFeedProps {
  refreshToken?: number
  userType?: "student" | "community"
  title?: string
  subtitle?: string
  emptyTitle?: string
  emptyMessage?: string
  viewerId?: string | null
  isDemo?: boolean
}

export function HomeFeed({
  refreshToken = 0,
  userType = "community",
  title,
  subtitle,
  emptyTitle,
  emptyMessage,
  viewerId = null,
  isDemo = false,
}: HomeFeedProps) {
  const isCommunityFeed = userType === "community"
  const [posts, setPosts] = useState<Post[]>(isCommunityFeed ? mockPosts : [])
  const [isLoading, setIsLoading] = useState(true)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const mountedRef = useRef(false)
  const lastSavedFingerprintRef = useRef<string | null>(null)
  const { toast } = useToast()
  const [isSavingPostcard, setIsSavingPostcard] = useState(false)

  const loadPosts = useCallback(async () => {
    if (!mountedRef.current || !viewerId || isDemo) {
      return
    }

    setIsLoading(true)
    setFallbackMessage(null)
    setIsFallback(false)

    try {
      const data = await fetchPosts(userType, viewerId)
      if (!mountedRef.current) return

      const usingFallback = isCommunityFeed && data.length === 0
      setPosts(usingFallback ? mockPosts : data)
      setIsFallback(usingFallback)

      if (usingFallback) {
        setFallbackMessage(
          "No live community updates yet, so we're showing your sample feed."
        )
      } else {
        setFallbackMessage(null)
      }
    } catch (err) {
      console.error("Failed to load posts:", err)
      if (!mountedRef.current) return

      if (isCommunityFeed) {
        setPosts(mockPosts)
        setIsFallback(true)
        setFallbackMessage(
          "We couldn't reach the community feed. You're seeing sample posts instead."
        )
      } else {
        setPosts([])
        setIsFallback(false)
        setFallbackMessage(
          "We couldn't reach the student feed. Try again in a moment."
        )
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [isCommunityFeed, isDemo, userType, viewerId])

  useEffect(() => {
    mountedRef.current = true
    if (isDemo) {
      if (isCommunityFeed) {
        setPosts(mockPosts)
        setIsFallback(true)
        setFallbackMessage("This is the guided HomeBridgr demo with curated community posts.")
      } else {
        setPosts([])
        setIsFallback(false)
        setFallbackMessage("Student posts are available once you sign in.")
      }
      setIsLoading(false)
    } else if (viewerId) {
      void loadPosts()
    }
    return () => {
      mountedRef.current = false
    }
  }, [isCommunityFeed, isDemo, loadPosts, viewerId])

  useEffect(() => {
    if (!mountedRef.current || !viewerId || isDemo) return
    void loadPosts()
  }, [isDemo, loadPosts, refreshToken, viewerId])

  // Auto-save a top-of-feed postcard collection once per unique set
  useEffect(() => {
    if (!isCommunityFeed) return
    if (!mountedRef.current) return
    if (isLoading) return
    if (!viewerId) return
    if (isFallback) return // don't persist sample data
    if (isDemo) return

    const topImages: Post[] = []
    for (const p of posts) {
      if (p.type === "user" && p.image) {
        topImages.push(p)
        if (topImages.length === 4) break
      }
    }
    if (topImages.length < 4) return

    const fingerprint = [...topImages.map((p) => p.id)].sort().join("|")
    if (lastSavedFingerprintRef.current === fingerprint) return

    ;(async () => {
      try {
        await createPostcardCollectionFromPosts(viewerId, topImages, {
          name: "Auto Postcard",
          visibility: "private",
          source: "auto",
        })
        lastSavedFingerprintRef.current = fingerprint
      } catch (e) {
        // non-fatal: log and continue
        console.warn("Failed to persist postcard collection:", e)
      }
    })()
  }, [isCommunityFeed, isDemo, isFallback, isLoading, posts, viewerId])

  const handleRetry = () => {
    if (!mountedRef.current || !viewerId || isDemo) return
    setFallbackMessage(null)
    setIsFallback(false)
    void loadPosts()
  }

  const headerTitle =
    title ?? (isCommunityFeed ? "Home" : "Student Feed")
  const headerSubtitle =
    subtitle ??
    (isCommunityFeed
      ? isDemo
        ? "Demo updates from the HomeBridgr sample community"
        : "Updates from your circle"
      : "Latest updates shared by students")
  const emptyStateTitle =
    emptyTitle ?? (isCommunityFeed ? "No posts yet" : "No student posts yet")
  const emptyStateMessage =
    emptyMessage ??
    (isCommunityFeed
      ? isDemo
        ? "Sign in to see fresh moments from your own family and community circle."
        : "Start the conversation by sharing a moment with your community."
      : "Encourage students to share what's happening on campus.")

  const containerMaxWidth = isCommunityFeed ? "max-w-4xl" : "max-w-2xl"
  const fallbackTitle = isDemo
    ? "You're viewing sample posts"
    : isFallback
      ? "Showing sample posts"
      : "We're having trouble loading posts"

  return (
    <div className={`${containerMaxWidth} mx-auto px-4 py-6`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {headerTitle}
            </h1>
            <p className="text-gray-600">
              {isLoading ? "Fetching the latest updates..." : headerSubtitle}
            </p>
          </div>

          {/* Save Postcard action */}
          {isCommunityFeed && (
            <button
              onClick={async () => {
                if (isDemo) {
                  toast({
                    title: "Sign in to save postcards",
                    description: "Create an account to capture collections from your real communities.",
                  })
                  return
                }
                if (isLoading || !viewerId || isFallback) return
                const topImages: Post[] = []
                for (const p of posts) {
                  if (p.type === "user" && p.image) {
                    topImages.push(p)
                    if (topImages.length === 4) break
                  }
                }
                if (topImages.length < 4) {
                  toast({ title: "Not enough images", description: "Need 4 image posts to save a postcard." })
                  return
                }
                const fingerprint = [...topImages.map((p) => p.id)].sort().join("|")
                if (lastSavedFingerprintRef.current === fingerprint) {
                  toast({ title: "Already saved", description: "This postcard is already in your collections." })
                  return
                }
                try {
                  setIsSavingPostcard(true)
                  await createPostcardCollectionFromPosts(viewerId, topImages, {
                    name: "Saved Postcard",
                    visibility: "private",
                    source: "manual",
                  })
                  lastSavedFingerprintRef.current = fingerprint
                  toast({ title: "Postcard saved", description: "Added to your postcard collections." })
                } catch (e: any) {
                  toast({ title: "Save failed", description: e?.message ?? "Could not save postcard." })
                } finally {
                  setIsSavingPostcard(false)
                }
              }}
              disabled={isDemo || isLoading || !viewerId || isFallback || isSavingPostcard}
              className="whitespace-nowrap inline-flex items-center rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={isDemo || isLoading || !viewerId || isFallback || isSavingPostcard}
            >
              {isSavingPostcard ? "Saving…" : "Save Postcard"}
            </button>
          )}
        </div>
      </div>

      {fallbackMessage && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{fallbackTitle}</p>
            <p className="mt-1 text-yellow-600">{fallbackMessage}</p>
            {!isDemo && (
              <button
                onClick={handleRetry}
                className="mt-3 inline-flex items-center rounded-lg border border-yellow-300 bg-white px-3 py-1.5 text-xs font-semibold text-yellow-700 transition-colors hover:bg-yellow-100"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading posts...</span>
        </div>
      )}

      {!isLoading && !isFallback && posts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-purple-200 bg-white/60 px-6 py-10 text-center text-gray-500">
          <h2 className="text-lg font-semibold text-gray-700">
            {emptyStateTitle}
          </h2>
          <p className="mt-2 text-sm">{emptyStateMessage}</p>
        </div>
      )}

      <div>
        {(() => {
          const list = posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))

          if (!isCommunityFeed) {
            return list
          }

          // For community feed, render postcard at the top when we have 4 image posts
          const topImages: Post[] = []
          for (const post of posts) {
            if (post.type === "user" && post.image) {
              topImages.push(post)
              if (topImages.length === 4) break
            }
          }

          if (topImages.length === 4) {
            const key = `postcard-top-${topImages.map((p) => p.id).join("-")}`
            return (
              <>
                <Postcard key={key} posts={topImages} />
                {list}
              </>
            )
          }

          return list
        })()}
      </div>
    </div>
  )
}
