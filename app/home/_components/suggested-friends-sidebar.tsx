"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface SuggestedUser {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
}

interface SuggestedFriendsSidebarProps {
  viewerId?: string | null
}

export function SuggestedFriendsSidebar({ viewerId = null }: SuggestedFriendsSidebarProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const url = viewerId
          ? `/api/users/suggested?viewerId=${encodeURIComponent(viewerId)}&limit=5`
          : `/api/users/suggested?limit=5`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        setUsers(data.users ?? [])
      } catch {
        // silently fail
      }
    }
    void fetchSuggested()
  }, [viewerId])

  const handleFollow = async (id: string) => {
    if (!viewerId) {
      toast({ description: "Sign in to follow people." })
      return
    }

    const isFollowing = followedIds.has(id)

    // Optimistic update
    setFollowedIds((prev) => {
      const next = new Set(prev)
      if (isFollowing) next.delete(id)
      else next.add(id)
      return next
    })

    try {
      const res = await fetch("/api/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: viewerId, followingId: id }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on error
      setFollowedIds((prev) => {
        const next = new Set(prev)
        if (isFollowing) next.add(id)
        else next.delete(id)
        return next
      })
      toast({ description: "Failed to update follow.", variant: "destructive" })
    }
  }

  return (
    <div className="w-80 bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm sticky top-20 h-fit">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Suggested for you</h2>

      {users.length === 0 ? (
        <p className="text-sm text-gray-400">No suggestions available.</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <Image
                src={user.avatarUrl || "/placeholder-user.jpg"}
                alt={user.displayName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  {user.displayName}
                </h3>
                {user.bio && (
                  <p className="text-xs text-gray-400 truncate">{user.bio}</p>
                )}
              </div>
              <button
                onClick={() => void handleFollow(user.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  followedIds.has(user.id)
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-sky-400 text-white hover:bg-sky-500"
                }`}
              >
                {followedIds.has(user.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-purple-100">
        <p className="text-xs text-gray-400">
          © 2025 HomeBridgr · About · Help · Privacy · Terms
        </p>
      </div>
    </div>
  )
}
