"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MapPin, Loader2, AlertTriangle } from "lucide-react"
import { PostCard } from "./post-card"
import { fetchPosts } from "@/lib/api/posts"
import type { Post } from "@/lib/types"

const DISTANCE_LIMITS: Record<string, number> = {
  "5 miles": 6,
  "10 miles": 12,
  "25 miles": Infinity,
}

interface DiscoverFeedProps {
  viewerId?: string | null
  isGuest?: boolean
}

export function DiscoverFeed({ viewerId = null, isGuest = false }: DiscoverFeedProps) {
  const [distance, setDistance] = useState("5 miles")
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)

  const loadPosts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [community, student] = await Promise.all([
        fetchPosts("community", viewerId).catch(() => [] as Post[]),
        fetchPosts("student", viewerId).catch(() => [] as Post[]),
      ])
      if (mountedRef.current) {
        // Deduplicate and sort newest first
        const seen = new Set<string>()
        const merged = [...community, ...student]
          .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setPosts(merged)
      }
    } catch {
      if (mountedRef.current) setError("Could not load posts.")
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [viewerId])

  useEffect(() => {
    mountedRef.current = true
    void loadPosts()
    return () => { mountedRef.current = false }
  }, [loadPosts])

  const limit = DISTANCE_LIMITS[distance] ?? Infinity
  const visiblePosts = isFinite(limit) ? posts.slice(0, limit) : posts

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-6 h-6 text-sky-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discover</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">People near you in Seattle</p>
      </div>

      {/* Location Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Showing posts within</span>
          <select
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="text-sm font-semibold text-sky-500 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option>5 miles</option>
            <option>10 miles</option>
            <option>25 miles</option>
          </select>
        </div>
      </div>

      {/* Posts */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {!isLoading && !error && visiblePosts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-purple-200 bg-white/60 dark:bg-gray-800/60 px-6 py-10 text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No posts nearby yet</p>
          <p className="mt-2 text-sm">Try expanding the distance filter.</p>
        </div>
      )}
      <div>
        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
