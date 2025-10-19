// ...existing code...
"use client"

import Image from "next/image"
import { Settings, MapPin, Users } from "lucide-react"
import { currentUser, mockPosts } from "@/lib/mock-data"

export function ProfileView() {
  const userPosts = mockPosts.filter((post) => post.type === "user" && post.author.id === currentUser.id)

  // ...existing code...
  const galleryImages = [
    "/raymond_pic1.jpg?height=300&width=300",
    "/raymond_pic2.jpg?height=300&width=300",
    "/raymond_pic3.jpg?height=300&width=300",
    "/raymond_pic4.jpg?height=300&width=300",
    "/raymond_pic5.jpg?height=300&width=300",
    "/raymond_pic6.jpg?height=300&width=300",
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header with gradient background */}
      <div className="gradient-purple-soft dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 rounded-3xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <button className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 flex items-center justify-center transition-colors">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center text-center">
          <Image
            src={currentUser.avatar || "/placeholder.svg"}
            alt={currentUser.displayName}
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{currentUser.displayName}</h1>
          <p className="text-purple-600 dark:text-purple-400 font-medium mb-3">@{currentUser.username}</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">{currentUser.bio}</p>

          {/* Location Info */}
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">From:</span> <span className="font-medium">{currentUser.hometown}</span>
              </span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lives in:</span> <span className="font-medium">{currentUser.location}</span>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">127</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">1.2K</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">342</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button className="flex-1 py-3 rounded-2xl gradient-purple text-white font-semibold hover:shadow-lg transition-all">
          Edit Profile
        </button>
        <button className="flex-1 py-3 rounded-2xl bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-gray-600 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors">
          Share Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-purple-100 dark:border-gray-700">
        <button className="flex-1 py-3 text-purple-600 dark:text-purple-400 font-semibold border-b-2 border-purple-600 dark:border-purple-400">Posts</button>
        <button className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          Liked
        </button>
        <button className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          Saved
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-2">
        {galleryImages.map((src, idx) => (
          <div
            key={i}
            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-200 to-violet-200"
          >
            <Image
              src="/vibrant-community-connection.png"
              alt={`Post ${i}`}
              fill
              className="object-cover hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 33vw, 200px"
            />
          </div>
        ))}
      </div>

      {/* Home Circle Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Home Circle</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Your closest connections</p>
        <div className="flex -space-x-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Image
              key={i}
              src="/diverse-group.png"
              alt={`Circle member ${i}`}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
          ))}
          <button className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-purple-100 dark:bg-gray-700 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-sm hover:bg-purple-200 dark:hover:bg-gray-600 transition-colors">
            +12
          </button>
        </div>
      </div>
    </div>
  )
}
// ...existing code...