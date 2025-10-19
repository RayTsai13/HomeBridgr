"use client"

import { Heart, MessageCircle, Share2, MapPin } from "lucide-react"
import type { Post } from "@/lib/types"
import { formatTimeAgo } from "@/lib/utils"
import { useState } from "react"
import { PostTranslation } from "./post-translation"

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
      <div className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm">
        {/* Image Collage Grid */}
        <div className="relative h-80 grid grid-cols-2 gap-1 p-1">
          {post.participants?.slice(0, 4).map((participant, index) => (
            <div
              key={participant.id}
              className="relative overflow-hidden rounded-2xl"
            >
              <img
                src={participant.avatar || "/placeholder.svg"}
                alt={participant.displayName}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          
          {/* Central Message Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl px-8 py-6 shadow-2xl max-w-xs text-center">
              <p className="text-2xl font-bold text-gray-900 mb-2">
                <PostTranslation text={post.content} componentType="post-card" />
              </p>
              <p className="text-sm text-gray-500">
                catch up with {post.participants?.[0]?.displayName}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.participants?.[0] && (
              <img
                src={post.participants[0].avatar || "/placeholder.svg"}
                alt={post.participants[0].displayName}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
            )}
            <span className="text-sm font-medium text-gray-700">
              {post.participants?.[0]?.displayName}
            </span>
          </div>
          <button className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
            View Messages →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <img
          src={post.author.avatar || "/placeholder.svg"}
          alt={post.author.displayName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{post.author.displayName}</h3>
          <p className="text-sm text-gray-500" suppressHydrationWarning>{formatTimeAgo(post.timestamp)}</p>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
          <MapPin className="w-5 h-5" />
          <span className="text-sm font-medium">{post.author.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 leading-relaxed">
          <PostTranslation text={post.content} componentType="post-card" />
        </p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-4 pb-3">
          <img
            src={post.image || "/placeholder.svg"}
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
          <Heart className={`w-6 h-6 ${isLiked ? "fill-purple-600 text-purple-600" : ""}`} />
          <span className="text-sm font-medium">{likes}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors">
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-medium">{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors ml-auto">
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
