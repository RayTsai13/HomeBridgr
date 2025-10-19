"use client"

import { useState } from "react"
import { currentUser } from "@/lib/mock-data"

interface PostComposerProps {
  onClose: () => void
}

export function PostComposer({ onClose }: PostComposerProps) {
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleImageSelect = () => {
    // In a real app, this would open a file picker
    setSelectedImage("/assets_photos/placeholder.svg?height=400&width=600")
  }

  const handlePost = () => {
    // In a real app, this would save the post
    console.log("[v0] Creating post:", { content, image: selectedImage })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-100">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-purple-100 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-600">✕</span>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={handlePost}
            disabled={!content.trim()}
            className="px-6 py-2 rounded-full gradient-purple text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            Post
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser.avatar || "/assets_photos/placeholder.svg"}
              alt={currentUser.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{currentUser.displayName}</h3>
              <p className="text-sm text-gray-500">@{currentUser.username}</p>
            </div>
          </div>

          {/* Text Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-32 text-lg text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none"
            autoFocus
          />

          {/* Image Preview */}
          {selectedImage && (
            <div className="relative mt-4 rounded-2xl overflow-hidden">
              <img src={selectedImage || "/assets_photos/placeholder.svg"} alt="Selected" className="w-full max-h-96 object-cover" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <span className="text-white">✕</span>
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-purple-100">
          <button
            onClick={handleImageSelect}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-purple-100 transition-colors"
          >
            <span className="text-purple-600">📷</span>
            <span className="text-sm font-medium text-gray-700">Photo</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-purple-100 transition-colors">
            <span className="text-purple-600">😊</span>
            <span className="text-sm font-medium text-gray-700">Emoji</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-purple-100 transition-colors">
            <span className="text-purple-600">📍</span>
            <span className="text-sm font-medium text-gray-700">Location</span>
          </button>
        </div>
      </div>
    </div>
  )
}
