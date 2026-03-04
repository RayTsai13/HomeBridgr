"use client"

import Image from "next/image"
import { Heart, MessageCircle, Share2, MapPin, ExternalLink, Send, Loader2 } from "lucide-react"
import type { Post } from "@/lib/types"
import { formatTimeAgo } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PostTranslation } from "./post-translation"
import { CaptionWithInsights } from "./caption-with-insights"
import { analyzePost, analyzeCaptionAdhoc } from "@/lib/api/posts"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useToast } from "@/hooks/use-toast"

type PostComment = {
  id: string
  content: string
  created_at: string
  author_id: string
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

interface PostCardProps {
  post: Post
  viewerId?: string | null
}

export function PostCard({ post, viewerId = null }: PostCardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { toast } = useToast()

  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likes, setLikes] = useState(post.likes)
  const [analysisTerms, setAnalysisTerms] = useState(post.analysisTerms ?? null)
  const autoRequestedRef = useRef(false)

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [localCommentCount, setLocalCommentCount] = useState(post.comments)

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

  const handleLike = async () => {
    if (!viewerId) {
      toast({ description: "Sign in to like posts.", variant: "destructive" })
      return
    }
    // Optimistic update
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikes(wasLiked ? likes - 1 : likes + 1)
    try {
      const res = await fetch(`/api/posts/${post.id}/likes`, {
        method: wasLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: viewerId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLikes(data.likesCount)
    } catch {
      // Revert optimistic update on error
      setIsLiked(wasLiked)
      setLikes(wasLiked ? likes : likes - 1)
      toast({ description: "Failed to update like.", variant: "destructive" })
    }
  }

  const loadComments = useCallback(async () => {
    setIsLoadingComments(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setComments(data.comments ?? [])
    } catch {
      // silently fail — table may not exist yet
    } finally {
      setIsLoadingComments(false)
    }
  }, [post.id])

  const handleToggleComments = useCallback(() => {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0 && !isLoadingComments) {
      void loadComments()
    }
  }, [showComments, comments.length, isLoadingComments, loadComments])

  const handleSubmitComment = async () => {
    const content = commentInput.trim()
    if (!content || isSubmittingComment) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ description: "Sign in to leave a comment.", variant: "destructive" })
      return
    }

    setIsSubmittingComment(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_id: user.id, content }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setComments((prev) => [...prev, data.comment])
      setLocalCommentCount((c) => c + 1)
      setCommentInput("")
    } catch {
      toast({ description: "Failed to post comment.", variant: "destructive" })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleShare = async () => {
    const shareText = `${post.author.displayName}: ${post.content}`
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText, title: "HomeBridgr" })
      } catch {
        // user cancelled the share sheet — no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        toast({ description: "Post copied to clipboard." })
      } catch {
        toast({ description: "Could not copy post.", variant: "destructive" })
      }
    }
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
          onClick={() => void handleLike()}
          className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Heart className={`w-7 h-7 ${isLiked ? "fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" : ""}`} />
          <span className="text-base font-medium">{likes}</span>
        </button>
        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-3 transition-colors ${showComments ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"}`}
        >
          <MessageCircle className={`w-7 h-7 ${showComments ? "fill-purple-100 dark:fill-purple-900" : ""}`} />
          <span className="text-base font-medium">{localCommentCount}</span>
        </button>
        <button
          onClick={() => void handleShare()}
          className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-auto"
        >
          <Share2 className="w-7 h-7" />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 pb-5 border-t border-purple-100 dark:border-gray-700">
          <div className="space-y-3 pt-4">
            {isLoadingComments && (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
            {!isLoadingComments && comments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No comments yet. Be the first!
              </p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Image
                  src={comment.profiles?.avatar_url || "/placeholder.svg"}
                  alt={comment.profiles?.display_name || "User"}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 py-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {comment.profiles?.display_name || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void handleSubmitComment()
                }
              }}
              placeholder="Write a comment…"
              className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none border border-gray-200 dark:border-gray-600 focus:border-purple-300 dark:focus:border-purple-500 transition-colors"
            />
            <button
              onClick={() => void handleSubmitComment()}
              disabled={!commentInput.trim() || isSubmittingComment}
              className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
            >
              {isSubmittingComment ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
