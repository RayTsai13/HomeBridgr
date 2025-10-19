"use client"

import Image from "next/image"
import { useState } from "react"
import { MapPin, Users } from "lucide-react"
import { PostTranslation } from "./post-translation"

interface Location {
  id: string
  name: string
  city: string
  distance: string
  image: string
  activeUsers: number
  posts: number
}

const topLocations: Location[] = [
  {
    id: "1",
    name: "Bob's Corn & Pumpkin Farm",
    city: "Snohomish",
    distance: "16 miles away",
    image: "/pumpkin.png",
    activeUsers: 1234,
    posts: 5678,
  },
  {
    id: "2",
    name: "Seattle Japanese Garden",
    city: "Seattle",
    distance: "2 miles away",
    image: "/garden.png",
    activeUsers: 2341,
    posts: 8901,
  },
  {
    id: "3",
    name: "T-Mobile Park",
    city: "Seattle",
    distance: "4.5 miles away",
    image: "/mariners.jpg",
    activeUsers: 1567,
    posts: 4532,
  },
  {
    id: "4",
    name: "Pike Place",
    city: "Downtown Seattle",
    distance: "4.8 miles away",
    image: "/pike.jpg",
    activeUsers: 987,
    posts: 3456,
  },
  {
    id: "5",
    name: "Cafe Solstice",
    city: "UDistrict",
    distance: "0.4 miles away",
    image: "/cafe.jpg",
    activeUsers: 1876,
    posts: 6789,
  },
]

export function TopLocationsSidebar() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const handleSave = (id: string) => {
    setSavedIds(prev => {
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
      <h2 className="text-lg font-bold text-gray-900 mb-4">Trending Locations</h2>
      
      <div className="space-y-4">
        {topLocations.map((location) => (
          <div key={location.id} className="flex flex-col gap-2">
            <div className="relative h-32 overflow-hidden rounded-xl">
              <Image
                src={location.image}
                alt={location.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                <p className="text-white text-xs font-semibold">
                  <PostTranslation text={location.name} componentType="top-locations" />
                </p>
                <p className="text-white/80 text-[10px]">
                  <PostTranslation text={`${location.city}, ${location.distance}`} componentType="top-locations" />
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{location.activeUsers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{location.posts} posts</span>
                </div>
              </div>
              
              <button
                onClick={() => handleSave(location.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  savedIds.has(location.id)
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-sky-400 text-white hover:bg-sky-500"
                }`}
              >
                {savedIds.has(location.id) ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-sky-200">
        <p className="text-xs text-gray-400">
          Explore trending locations
        </p>
      </div>
    </div>
  )
}
