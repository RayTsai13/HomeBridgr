"use client"

import Image from "next/image"
import { Heart, MessageCircle, Share2, MapPin, ExternalLink } from "lucide-react"
import type { Post } from "@/lib/types"
import { formatTimeAgo } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PostTranslation } from "./post-translation"
import { CaptionWithInsights } from "./caption-with-insights"
import { analyzePost, analyzeCaptionAdhoc } from "@/lib/api/posts"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likes, setLikes] = useState(post.likes)
  const [analysisTerms, setAnalysisTerms] = useState(post.analysisTerms ?? null)
  const autoRequestedRef = useRef(false)

  useEffect(() => {
    setAnalysisTerms(post.analysisTerms ?? null)
  }, [post.analysisTerms])

  const isUuid = useMemo(
    () =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        post.id
      ),
    [post.id]
  )

  const canAnalyze = post.type === "user"

  const runAnalysis = useCallback(async () => {
    try {
      const result = isUuid
        ? await analyzePost(post.id)
        : await analyzeCaptionAdhoc(post.content)
      if (result.terms.length) {
        setAnalysisTerms(result.terms)
      }
    } catch (error) {
      console.error("Caption analysis failed:", error)
    }
  }, [isUuid, post.content, post.id])

  useEffect(() => {
    if (!analysisTerms && canAnalyze && !autoRequestedRef.current) {
      autoRequestedRef.current = true
      void runAnalysis()
    }
  }, [analysisTerms, canAnalyze, runAnalysis])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  if (post.type === "message-summary") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-visible mb-6 shadow-sm">
        {/* Image Collage Grid */}
        <div className="relative h-[30rem] grid grid-cols-2 gap-1 p-1">
          {post.images?.slice(0, 4).map((image, index) => (
            <div
              key={index}
              className="relative h-full overflow-hidden rounded-2xl"
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Shared image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
          
          {/* Central Message Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl px-10 py-8 shadow-2xl max-w-md text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                <PostTranslation text={post.content} componentType="post-card" />
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">
                catch up with {post.participants?.[0]?.displayName}
              </p>
            </div>
          </div>
        </div>

        {/* Links Section */}
        {post.links && post.links.length > 0 && (
          <div className="px-6 py-4 border-t border-purple-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Shared Links
            </h4>
            <div className="space-y-2">
              {post.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-black dark:text-sky-300">{link.title}</span>
                    <ExternalLink className="w-5 h-5 text-sky-300 dark:text-sky-300" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-purple-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.participants?.[0] && (
              <Image
                src={post.participants[0].avatar || "/placeholder.svg"}
                alt={post.participants[0].displayName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700"
              />
            )}
            <span className="text-base font-medium text-gray-700 dark:text-gray-300">
              {post.participants?.[0]?.displayName}
            </span>
          </div>
          <button className="text-base font-medium text-black dark:text-purple-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
            View Messages →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-visible mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 p-6">
        <Image
          src={post.author.avatar || "/placeholder.svg"}
          alt={post.author.displayName}
          width={72}
          height={72}
          className="w-[4.5rem] h-[4.5rem] rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{post.author.displayName}</h3>
          <p className="text-base text-gray-500 dark:text-gray-400" suppressHydrationWarning>{formatTimeAgo(post.timestamp)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-full">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{post.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 px-4 py-1">
            <span className="text-sm">From: {post.author.hometown}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        {analysisTerms && analysisTerms.length > 0 ? (
          <CaptionWithInsights text={post.content} terms={analysisTerms} />
        ) : (
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
            <PostTranslation text={post.content} componentType="post-card" />
          </p>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-6 pb-4">
          <Image
            src={post.image || "/placeholder.svg"}
            alt="Post content"
            width={1200}
            height={900}
            className="w-full h-auto rounded-2xl object-cover max-h-[36rem]"
            sizes="100vw"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-8 px-6 py-4 border-t border-purple-100 dark:border-gray-700">
        <button
          onClick={handleLike}
          className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Heart className={`w-7 h-7 ${isLiked ? "fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" : ""}`} />
          <span className="text-base font-medium">{likes}</span>
        </button>
        <button className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          <MessageCircle className="w-7 h-7" />
          <span className="text-base font-medium">{post.comments}</span>
        </button>
        <button className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-auto">
          <Share2 className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}
