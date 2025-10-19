"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { X, ImageIcon, Smile, MapPin, Loader2, AlertCircle } from "lucide-react"
import { createPost } from "@/lib/api/posts"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { SessionUser } from "@/lib/types"

interface PostComposerProps {
  onClose: () => void
  onPostCreated?: () => void
  author: SessionUser | null
}

export function PostComposer({ onClose, onPostCreated, author }: PostComposerProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [content, setContent] = useState("")
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const previewImageSrc = selectedImageUrl
    ? selectedImageUrl.split("?")[0] || selectedImageUrl
    : null

  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl)
      }
    }
  }, [selectedImageUrl])

  const clearSelectedImage = () => {
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
    }
    setSelectedImageUrl(null)
    setSelectedFile(null)
  }

  const handleClose = () => {
    setContent("")
    setError(null)
    clearSelectedImage()
    onClose()
  }

  const handleImageSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setError(null)

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setSelectedImageUrl(objectUrl)
  }

  const handlePost = async () => {
    if (!author?.id || !content.trim()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let imageUrl: string | null = null

      if (selectedFile) {
        setUploading(true)
        const extension = selectedFile.name.split(".").pop() ?? "jpg"
        const filePath = `posts/${author.id}/${Date.now()}.${extension}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("student_uploads")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError || !uploadData) {
          throw new Error(
            uploadError?.message ??
              "Failed to upload image. Ensure the 'post-images' bucket exists and is public."
          )
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("student_uploads").getPublicUrl(uploadData.path)

        imageUrl = publicUrl
      }

      await createPost({
        caption: content.trim(),
        authorId: author.id,
        imageUrl,
      })

      setContent("")
      setSelectedFile(null)
      clearSelectedImage()
      onPostCreated?.()
      onClose()
    } catch (err) {
      console.error("Failed to create post:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create post. Please try again."
      )
    } finally {
      setUploading(false)
      setIsSubmitting(false)
    }
  }

  const displayName =
    author?.displayName ??
    author?.email ??
    "HomeBridgr User"

  const handle =
    author?.email
      ? author.email.split("@")[0]
      : displayName.toLowerCase().replace(/\s+/g, "")

  const avatarUrl = author?.avatarUrl ?? "/placeholder-user.jpg"

  const postDisabled = !author?.id || !content.trim() || isSubmitting || uploading

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="animate-in slide-in-from-bottom duration-300 w-full max-h-[90vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 p-4">
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-purple-100"
            disabled={isSubmitting}
            aria-label="Close composer"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={handlePost}
            disabled={postDisabled}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-2 font-medium text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {(isSubmitting || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            Post
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-4">
          {/* User Info */}
          <div className="mb-4 flex items-center gap-3">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{displayName}</h3>
              <p className="text-sm text-gray-500">@{handle}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">We couldn&apos;t publish your post</p>
                <p className="mt-1 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Text Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              author?.displayName
                ? `What's on your mind, ${author.displayName}?`
                : "What's on your mind?"
            }
            className="min-h-32 w-full resize-none text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none"
            autoFocus
            disabled={!author?.id || isSubmitting}
          />

          {/* Image Preview */}
          {previewImageSrc && (
            <div className="relative mt-4 overflow-hidden rounded-2xl">
              <Image
                src={previewImageSrc}
                alt="Selected"
                width={1200}
                height={900}
                className="h-auto max-h-96 w-full object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <button
                onClick={clearSelectedImage}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 transition-colors hover:bg-black/70"
                aria-label="Remove selected image"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-purple-100 p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSubmitting}
          />
          <button
            onClick={handleImageSelect}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-lime-100 transition-colors"
            disabled={isSubmitting}
          >
            <ImageIcon className="w-5 h-5 text-lime-500" />
            <span className="text-sm font-medium text-gray-700">
              {selectedFile ? "Change Photo" : "Photo"}
            </span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-lime-100 transition-colors"
            disabled
          >
            <Smile className="w-5 h-5 text-lime-500" />
            <span className="text-sm font-medium text-gray-700">Emoji</span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-lime-100 transition-colors"
            disabled
          >
            <MapPin className="w-5 h-5 text-lime-500" />
            <span className="text-sm font-medium text-gray-700">Location</span>
          </button>
        </div>
      </div>
    </div>
  )
}
