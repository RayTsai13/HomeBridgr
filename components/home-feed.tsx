"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { PostCard } from "./post-card"
import type { Post } from "@/lib/types"
import { fetchPosts } from "@/lib/api/posts"
import { mockPosts } from "@/lib/mock-data"

interface HomeFeedProps {
  refreshToken?: number
}

export function HomeFeed({ refreshToken = 0 }: HomeFeedProps) {
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [isLoading, setIsLoading] = useState(true)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const mountedRef = useRef(false)

  const loadPosts = useCallback(async () => {
    if (!mountedRef.current) return

    setIsLoading(true)
    setFallbackMessage(null)
    setIsFallback(false)

    try {
      const data = await fetchPosts()
      if (!mountedRef.current) return

      const usingFallback = data.length === 0
      setPosts(usingFallback ? mockPosts : data)
      setIsFallback(usingFallback)
      if (usingFallback) {
        setFallbackMessage("No live updates yet, so we're showing your sample feed.")
      }
    } catch (err) {
      console.error("Failed to load posts:", err)
      if (!mountedRef.current) return

      setPosts(mockPosts)
      setIsFallback(true)
      setFallbackMessage("We couldn't reach the live feed. You're seeing sample posts instead.")
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void loadPosts()
    return () => {
      mountedRef.current = false
    }
  }, [loadPosts])

  useEffect(() => {
    if (!mountedRef.current) return
    void loadPosts()
  }, [loadPosts, refreshToken])

  const handleRetry = () => {
    if (!mountedRef.current) return
    setFallbackMessage(null)
    setIsFallback(false)
    void loadPosts()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Home</h1>
        <p className="text-gray-600">
          {isLoading ? "Fetching the latest updates..." : "Updates from your circle"}
        </p>
      </div>

      {fallbackMessage && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Showing sample posts</p>
            <p className="mt-1 text-yellow-600">{fallbackMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-3 inline-flex items-center rounded-lg border border-yellow-300 bg-white px-3 py-1.5 text-xs font-semibold text-yellow-700 transition-colors hover:bg-yellow-100"
            >
              Try again
            </button>
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
          <h2 className="text-lg font-semibold text-gray-700">No posts yet</h2>
          <p className="mt-2 text-sm">
            Start the conversation by sharing a moment with your community.
          </p>
        </div>
      )}

      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
