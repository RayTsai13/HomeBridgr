"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"

interface SuggestedFriend {
  id: string
  name: string
  username: string
  avatar: string
  mutualFriends: number
}

const suggestedFriends: SuggestedFriend[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    username: "@sarahj",
    avatar: "/professional-woman.png",
    mutualFriends: 12,
  },
  {
    id: "2",
    name: "Michael Chen",
    username: "@mchen",
    avatar: "/casual-man.png",
    mutualFriends: 8,
  },
  {
    id: "3",
    name: "Emma Davis",
    username: "@emmad",
    avatar: "/diverse-woman-smiling.png",
    mutualFriends: 15,
  },
  {
    id: "4",
    name: "Alex Rodriguez",
    username: "@alexr",
    avatar: "/placeholder-user.jpg",
    mutualFriends: 5,
  },
  {
    id: "5",
    name: "Jessica Lee",
    username: "@jlee",
    avatar: "/diverse-person-park.png",
    mutualFriends: 20,
  },
]

export function SuggestedFriendsSidebar() {
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  const handleFollow = (id: string) => {
    setFollowedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="w-80 bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm sticky top-20 h-fit">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Suggested for you</h2>
      
      <div className="space-y-4">
        {suggestedFriends.map((friend) => (
          <div key={friend.id} className="flex items-center gap-3">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">
                {friend.name}
              </h3>
              <p className="text-xs text-gray-400">
                {friend.mutualFriends} mutual friends
              </p>
            </div>
            <button
              onClick={() => handleFollow(friend.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                followedIds.has(friend.id)
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {followedIds.has(friend.id) ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-purple-100">
        <p className="text-xs text-gray-400">
          © 2025 HomeBridgr · About · Help · Privacy · Terms
        </p>
      </div>
    </div>
  )
}

