"use client"

import { PostCard } from "./post-card"
import { mockPosts } from "./mock-data"

export function HomeFeed() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Home</h1>
        <p className="text-gray-600 dark:text-gray-300">Updates from your circle</p>
      </div>

      {/* Posts */}
      <div>
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
