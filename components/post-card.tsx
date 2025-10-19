"use client"

import type { Post } from "@/lib/types"
import { formatTimeAgo } from "@/lib/utils"
import { useState } from "react"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likes, setLikes] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  if (post.type === "message-summary") {
    return (
      <div className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-3xl p-6 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Message Summary</h3>
            <p className="text-sm text-purple-700">{formatTimeAgo(post.timestamp)}</p>
          </div>
        </div>
        <p className="text-purple-900 mb-4">{post.content}</p>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {post.participants?.slice(0, 3).map((participant) => (
              <img
                key={participant.id}
                src={participant.avatar || "/assets_photos/placeholder.svg"}
                alt={participant.displayName}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
            ))}
          </div>
          <span className="text-sm text-purple-700 font-medium">{post.messageCount} new messages</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <img
          src={post.author.avatar || "/assets_photos/placeholder.svg"}
          alt={post.author.displayName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{post.author.displayName}</h3>
          <p className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-4 pb-3">
          <img
            src={post.image || "/assets_photos/placeholder.svg"}
            alt="Post content"
            className="w-full rounded-2xl object-cover max-h-96"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-purple-100">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <span className={`text-2xl ${isLiked ? "text-red-500" : ""}`}>
            {isLiked ? "❤️" : "🤍"}
          </span>
          <span className="text-sm font-medium">{likes}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors">
          <span className="text-2xl">💬</span>
          <span className="text-sm font-medium">{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors ml-auto">
          <span className="text-2xl">📤</span>
        </button>
      </div>
    </div>
  )
}
