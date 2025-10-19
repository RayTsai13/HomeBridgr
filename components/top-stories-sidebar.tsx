"use client"

import { useState } from "react"
import { TrendingUp, Eye, Clock } from "lucide-react"
import { PostTranslation } from "./post-translation"

interface Story {
  id: string
  title: string
  category: string
  image: string
  views: number
  timeAgo: string
  trending: boolean
}

const topStories: Story[] = [
  {
    id: "1",
    title: "Community Garden Project Brings Neighbors Together",
    category: "Local News",
    image: "/diverse-group.png",
    views: 2341,
    timeAgo: "2h ago",
    trending: true,
  },
  {
    id: "2",
    title: "New Coffee Shop Opens Downtown with Live Music",
    category: "Business",
    image: "/cozy-cafe.png",
    views: 1876,
    timeAgo: "4h ago",
    trending: true,
  },
  {
    id: "3",
    title: "Local Artist's Mural Transforms City Street",
    category: "Arts & Culture",
    image: "/vibrant-street-art.png",
    views: 3421,
    timeAgo: "6h ago",
    trending: false,
  },
  {
    id: "4",
    title: "Annual Beach Cleanup Event This Weekend",
    category: "Environment",
    image: "/sunset-beach-tranquil.png",
    views: 1234,
    timeAgo: "8h ago",
    trending: false,
  },
  {
    id: "5",
    title: "New Park Opens with Free Outdoor Concerts",
    category: "Community",
    image: "/diverse-person-park.png",
    views: 2987,
    timeAgo: "10h ago",
    trending: true,
  },
]

export function TopStoriesSidebar() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  const handleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
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
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">Top Stories</h2>
      </div>
      
      <div className="space-y-4">
        {topStories.map((story) => (
          <div key={story.id} className="flex flex-col gap-2 group cursor-pointer">
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-32 object-cover transition-transform group-hover:scale-105"
              />
              {story.trending && (
                <div className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded-lg flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span className="text-white text-[10px] font-semibold">Trending</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <span className="text-purple-300 text-[10px] font-semibold">{story.category}</span>
                <h3 className="text-white text-sm font-semibold line-clamp-2 mt-1">
                  <PostTranslation text={story.title} componentType="top-stories" />
                </h3>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{story.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{story.timeAgo}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleBookmark(story.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  bookmarkedIds.has(story.id)
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {bookmarkedIds.has(story.id) ? "Saved" : "Read"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-purple-100">
        <p className="text-xs text-gray-400">
          Stay updated with local news & events
        </p>
      </div>
    </div>
  )
}

