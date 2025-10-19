"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { PostCard } from "./post-card"
import type { Post } from "@/lib/types"
import { fetchPosts } from "@/lib/api/posts"

export function HomeFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(false)

  const loadPosts = useCallback(async () => {
    if (!mountedRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchPosts()
      if (!mountedRef.current) return
      setPosts(data)
    } catch (err) {
      console.error("Failed to load posts:", err)
      if (!mountedRef.current) return
      setPosts([])
      setError("Unable to load posts right now. Please try again.")
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

  const handleRetry = () => {
    if (!mountedRef.current) return
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

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">We couldn&apos;t load the feed.</p>
          <p className="mt-1 text-red-600">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-3 inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading posts...</span>
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
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
