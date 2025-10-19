"use client"

import { currentUser, mockPosts } from "@/lib/mock-data"

export function ProfileView() {
  const userPosts = mockPosts.filter((post) => post.type === "user" && post.author.id === currentUser.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header with gradient background */}
      <div className="gradient-purple-soft rounded-3xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <button className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors">
            <span className="text-purple-600">⚙️</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center text-center">
          <img
            src={currentUser.avatar || "/assets_photos/placeholder.svg"}
            alt={currentUser.displayName}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentUser.displayName}</h1>
          <p className="text-purple-600 font-medium mb-3">@{currentUser.username}</p>
          <p className="text-gray-700 mb-4 max-w-md">{currentUser.bio}</p>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <span>📍</span>
            <span className="text-sm">{currentUser.location}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">127</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">1.2K</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">342</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button className="flex-1 py-3 rounded-2xl gradient-purple text-white font-semibold hover:shadow-lg transition-all">
          Edit Profile
        </button>
        <button className="flex-1 py-3 rounded-2xl bg-white border-2 border-purple-200 text-purple-600 font-semibold hover:bg-purple-50 transition-colors">
          Share Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-purple-100">
        <button className="flex-1 py-3 text-purple-600 font-semibold border-b-2 border-purple-600">Posts</button>
        <button className="flex-1 py-3 text-gray-500 font-semibold hover:text-purple-600 transition-colors">
          Liked
        </button>
        <button className="flex-1 py-3 text-gray-500 font-semibold hover:text-purple-600 transition-colors">
          Saved
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-200 to-violet-200"
          >
            <img
              src={`/assets_photos/vibrant-community-connection.png?height=300&width=300&query=social media post ${i}`}
              alt={`Post ${i}`}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      {/* Home Circle Section */}
      <div className="mt-8 bg-white rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-purple-600">👥</span>
          <h2 className="text-xl font-bold text-gray-900">Home Circle</h2>
        </div>
        <p className="text-gray-600 text-sm mb-4">Your closest connections</p>
        <div className="flex -space-x-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <img
              key={i}
              src={`/assets_photos/diverse-group.png?height=40&width=40&query=person ${i}`}
              alt={`Circle member ${i}`}
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
          ))}
          <button className="w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm hover:bg-purple-200 transition-colors">
            +12
          </button>
        </div>
      </div>
    </div>
  )
}
