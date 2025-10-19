"use client"

import Image from "next/image"
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react"
import type { Post } from "@/lib/types"
import { formatTimeAgo } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PostTranslation } from "./post-translation"
import { analyzePost } from "@/lib/api/posts"
import { CaptionWithInsights } from "./caption-with-insights"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likes, setLikes] = useState(post.likes)
  const [analysisTerms, setAnalysisTerms] = useState(post.analysisTerms ?? null)
  const [analysisGeneratedAt, setAnalysisGeneratedAt] = useState<Date | undefined>(
    post.analysisGeneratedAt
  )
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const autoRequestedRef = useRef(false)

  useEffect(() => {
    setAnalysisTerms(post.analysisTerms ?? null)
    setAnalysisGeneratedAt(post.analysisGeneratedAt)
  }, [post.analysisTerms, post.analysisGeneratedAt])

  const canAnalyze = useMemo(() => {
    return (
      post.type === "user" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        post.id
      )
    )
  }, [post])

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) {
      setAnalysisError("This caption can only be explained for live posts.")
      return
    }

    setAnalysisLoading(true)
    setAnalysisError(null)

    try {
      const result = await analyzePost(post.id)
      setAnalysisTerms(result.terms)
      setAnalysisGeneratedAt(result.generatedAt)
    } catch (error) {
      console.error("Caption analysis failed:", error)
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Unable to explain this caption right now."
      )
    } finally {
      setAnalysisLoading(false)
    }
  }, [canAnalyze, post.id])

  useEffect(() => {
    if (
      canAnalyze &&
      !analysisTerms &&
      !analysisLoading &&
      !autoRequestedRef.current
    ) {
      autoRequestedRef.current = true
      void handleAnalyze()
    }
  }, [canAnalyze, analysisTerms, analysisLoading, handleAnalyze])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  if (post.type === "message-summary") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden mb-4 shadow-sm">
        {/* Image Collage Grid */}
        <div className="relative h-80 grid grid-cols-2 gap-1 p-1">
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
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl px-8 py-6 shadow-2xl max-w-xs text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                <PostTranslation text={post.content} componentType="post-card" />
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                catch up with {post.participants?.[0]?.displayName}
              </p>
            </div>
          </div>
        </div>

        {/* Links Section */}
        {post.links && post.links.length > 0 && (
          <div className="px-4 py-3 border-t border-purple-100 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
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
                  className="block bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{link.title}</span>
                    <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-purple-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.participants?.[0] && (
              <Image
                src={post.participants[0].avatar || "/placeholder.svg"}
                alt={post.participants[0].displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700"
              />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {post.participants?.[0]?.displayName}
            </span>
          </div>
          <button className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            View Messages →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Image
          src={post.author.avatar || "/placeholder.svg"}
          alt={post.author.displayName}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{post.author.displayName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400" suppressHydrationWarning>{formatTimeAgo(post.timestamp)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">{post.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 px-3 py-0.5">
            <span className="text-xs">From: {post.author.hometown}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {analysisTerms && analysisTerms.length > 0 ? (
          <CaptionWithInsights text={post.content} terms={analysisTerms} />
        ) : (
          <p className="leading-relaxed text-gray-800 dark:text-gray-200">
            <PostTranslation text={post.content} componentType="post-card" />
          </p>
        )}
      </div>

      {/* Caption Analysis */}
      <div className="px-4 pb-3">
        <div className="rounded-2xl border border-purple-100 bg-purple-50/60 dark:border-gray-700 dark:bg-gray-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
              <Sparkles className="h-4 w-4" />
              Caption clarifier
            </div>
            {analysisGeneratedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated {formatTimeAgo(analysisGeneratedAt)}
              </span>
            )}
          </div>

          {analysisTerms && analysisTerms.length > 0 ? (
            <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hover the highlighted phrases above to see what they mean.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analysisLoading}
                className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-purple-300 dark:hover:bg-gray-700"
              >
                {analysisLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Run again
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <button
                onClick={handleAnalyze}
                disabled={analysisLoading || !canAnalyze}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {analysisLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Explaining…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Explain this caption
                  </>
                )}
              </button>
              {!canAnalyze && (
                <p className="mt-2 text-xs text-gray-500">
                  Save this post to Supabase to run the caption clarifier.
                </p>
              )}
            </div>
          )}

          {analysisError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-4 pb-3">
          <Image
            src={post.image || "/placeholder.svg"}
            alt="Post content"
            width={1200}
            height={900}
            className="w-full h-auto rounded-2xl object-cover max-h-96"
            sizes="100vw"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-purple-100 dark:border-gray-700">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Heart className={`w-6 h-6 ${isLiked ? "fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" : ""}`} />
          <span className="text-sm font-medium">{likes}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-medium">{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-auto">
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
