"use client"

import { PostCard } from "./post-card"
import { mockLocalPosts } from "@/lib/mock-data"
import { MapPin } from "lucide-react"

export function DiscoverFeed() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-6 h-6 text-sky-500" />
          <h1 className="text-3xl font-bold text-gray-900">Discover</h1>
        </div>
        <p className="text-gray-600">People near you in Seattle</p>
      </div>

      {/* Location Filter */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Showing posts within</span>
          <select className="text-sm font-semibold text-sky-400 bg-transparent border-none focus:outline-none">
            <option>5 miles</option>
            <option>10 miles</option>
            <option>25 miles</option>
          </select>
        </div>
      </div>

      {/* Posts */}
      <div>
        {mockLocalPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
