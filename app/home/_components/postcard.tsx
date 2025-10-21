"use client"

import Image from "next/image"
import type { Post } from "@/lib/types"
import { PostTranslation } from "./post-translation"

interface PostcardProps {
  posts: Post[]
}

// Renders a 2x2 image collage from 4 image posts with all captions underneath
export function Postcard({ posts }: PostcardProps) {
  const items = (posts || []).filter((p) => Boolean(p.image)).slice(0, 4)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden mb-4 shadow-sm">
      {/* 2x2 Collage */}
      <div className="relative h-80 grid grid-cols-2 gap-1 p-1">
        {items.map((p, index) => (
          <div key={p.id + index} className="relative h-full overflow-hidden rounded-2xl">
            <Image
              src={p.image || "/placeholder.svg"}
              alt={`Postcard image ${index + 1} by ${p.author.displayName}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>

      {/* Captions underneath */}
      <div className="px-4 py-4 border-t border-purple-100 dark:border-gray-700 space-y-3">
        {items.map((p) => (
          <p key={`caption-${p.id}`} className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
            <span className="font-semibold text-gray-900 dark:text-white mr-1">{p.author.displayName}:</span>
            <PostTranslation text={p.content} componentType="post-card" />
          </p>
        ))}
      </div>
    </div>
  )
}

