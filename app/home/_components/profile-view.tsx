"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  Settings,
  MapPin,
  Users,
  Folder,
  FolderPlus,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react"
import { currentUser } from "@/lib/mock-data"
import type { SessionUser, Collection, Post } from "@/lib/types"
import { fetchCollections, createCollection } from "@/lib/api/collections"
import { fetchPosts } from "@/lib/api/posts"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useToast } from "@/hooks/use-toast"

interface ProfileViewProps {
  user: SessionUser | null
  isDemo?: boolean
}

export function ProfileView({ user, isDemo = false }: ProfileViewProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { toast } = useToast()

  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [nameInput, setNameInput] = useState("")
  const [descriptionInput, setDescriptionInput] = useState("")
  const [visibilityInput, setVisibilityInput] = useState("private")

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null)

  // Real user posts for gallery
  const [realPosts, setRealPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const mountedRef = useRef(false)

  const profileInfo = useMemo(() => {
    const fallback = currentUser
    const displayName = localDisplayName ?? user?.displayName ?? fallback.displayName
    const username = user?.email?.split("@")[0] ?? fallback.username
    return {
      displayName,
      username,
      email: user?.email ?? null,
      avatar: user?.avatarUrl ?? fallback.avatar,
      bio: fallback.bio,
      hometown: fallback.hometown,
      location: fallback.location,
    }
  }, [user, localDisplayName])

  const demoGalleryImages = [
    "/raymond_pic1.jpg?height=300&width=300",
    "/raymond_pic2.jpg?height=300&width=300",
    "/raymond_pic3.jpg?height=300&width=300",
    "/raymond_pic4.jpg?height=300&width=300",
    "/raymond_pic5.jpg?height=300&width=300",
    "/raymond_pic6.jpg?height=300&width=300",
  ]

  // Load real user posts
  useEffect(() => {
    mountedRef.current = true
    if (isDemo || !user?.id) return

    const load = async () => {
      setPostsLoading(true)
      try {
        const [community, student] = await Promise.all([
          fetchPosts("community", user.id).catch(() => [] as Post[]),
          fetchPosts("student", user.id).catch(() => [] as Post[]),
        ])
        if (!mountedRef.current) return
        const seen = new Set<string>()
        const mine = [...community, ...student]
          .filter((p) => {
            if (p.author.id !== user.id || seen.has(p.id)) return false
            seen.add(p.id)
            return true
          })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setRealPosts(mine)
      } catch {
        // silently fail — gallery stays empty
      } finally {
        if (mountedRef.current) setPostsLoading(false)
      }
    }

    void load()
    return () => { mountedRef.current = false }
  }, [isDemo, user?.id])

  const postCount = isDemo ? 0 : realPosts.length

  useEffect(() => {
    if (isDemo || !user?.id) {
      setCollections([])
      setCollectionsError(isDemo ? "Demo mode is read-only. Sign in to manage your postcard collections." : "Sign in to create postcard collections.")
      return
    }

    let cancelled = false

    const loadCollections = async () => {
      setCollectionsLoading(true)
      setCollectionsError(null)
      try {
        const data = await fetchCollections(user.id)
        if (!cancelled) {
          setCollections(data)
        }
      } catch (error) {
        console.error("Failed to load collections:", error)
        if (!cancelled) {
          setCollectionsError(
            error instanceof Error
              ? error.message
              : "Unable to load collections."
          )
          setCollections([])
        }
      } finally {
        if (!cancelled) {
          setCollectionsLoading(false)
        }
      }
    }

    void loadCollections()

    return () => {
      cancelled = true
    }
  }, [isDemo, user?.id])

  const handleCreateCollection = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user?.id) {
      setCreateError("Sign in to create collections.")
      return
    }

    const trimmedName = nameInput.trim()
    if (!trimmedName) {
      setCreateError("Give your collection a name.")
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const newCollection = await createCollection({
        name: trimmedName,
        userId: user.id,
        description: descriptionInput.trim() || undefined,
        visibility: visibilityInput,
      })

      setCollections((prev) => [newCollection, ...prev])
      setNameInput("")
      setDescriptionInput("")
      setVisibilityInput("private")
    } catch (error) {
      console.error("Failed to create collection:", error)
      setCreateError(
        error instanceof Error
          ? error.message
          : "Unable to create collection right now."
      )
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditName(profileInfo.displayName ?? "")
    }
    setIsEditing((v) => !v)
  }

  const handleSaveProfile = async () => {
    if (!user?.id || isSaving) return
    const trimmed = editName.trim()
    if (!trimmed) return

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      })
      if (error) throw error
      setLocalDisplayName(trimmed)
      setIsEditing(false)
      toast({ description: "Profile updated." })
    } catch {
      toast({ description: "Could not save changes.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleShareProfile = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      await navigator.clipboard.writeText(url)
      toast({ description: "Profile link copied to clipboard." })
    } catch {
      toast({ description: "Could not copy link.", variant: "destructive" })
    }
  }

  return (
    <div className="max-w-2xl px-4 py-6 mx-auto">
      {/* Header with gradient background */}
      <div className="gradient-purple-soft dark:bg-gradient-to-br dark:from-cyan-900 dark:to-cyan-700 rounded-3xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <button
            onClick={handleEditToggle}
            className="flex items-center justify-center w-10 h-10 transition-colors rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600"
            aria-label="Edit profile"
          >
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center text-center">
          <Image
            src={profileInfo.avatar || "/placeholder.svg"}
            alt={profileInfo.displayName}
            width={96}
            height={96}
            className="w-24 h-24 mb-4 border-4 border-white rounded-full shadow-lg object-cover"
          />
          {isEditing ? (
            <div className="w-full max-w-xs mb-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSaveProfile() }}
                placeholder="Display name"
                className="w-full text-center text-lg font-bold rounded-xl border border-purple-300 bg-white/90 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-2"
                autoFocus
              />
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => void handleSaveProfile()}
                  disabled={isSaving || !editName.trim()}
                  className="flex items-center gap-1 rounded-full bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </button>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-1 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{profileInfo.displayName}</h1>
              <p className="text-purple-600 dark:text-sky-300 font-medium mb-3">@{profileInfo.username}</p>
              <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">{profileInfo.bio}</p>
            </>
          )}

          {/* Location Info */}
          <div className="flex items-center gap-4 mb-4 text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">From:</span>{" "}
                <span className="font-medium">{profileInfo.hometown}</span>
              </span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Lives in:
                </span>{" "}
                <span className="font-medium">{profileInfo.location}</span>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {postCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Posts
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                1.2K
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Followers
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                342
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Following
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleEditToggle}
          className="flex-1 py-3 font-semibold text-white transition-all rounded-2xl gradient-purple hover:shadow-lg"
        >
          Edit Profile
        </button>
        <button
          onClick={() => void handleShareProfile()}
          className="flex-1 py-3 font-semibold transition-colors rounded-2xl bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-gray-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700"
        >
          Share Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-purple-100 dark:border-gray-700">
        <button className="flex-1 py-3 text-purple-600 dark:text-sky-300 font-semibold border-b-2 border-purple-600 dark:border-sky-300">Posts</button>
        <button className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-semibold hover:text-purple-600 dark:hover:text-sky-300 transition-colors">
          Liked
        </button>
        <button className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-semibold hover:text-purple-600 dark:hover:text-sky-300 transition-colors">
          Saved
        </button>
      </div>

      {/* Posts Grid */}
      {isDemo ? (
        <div className="grid grid-cols-3 gap-2">
          {demoGalleryImages.map((src, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-purple-200 to-violet-200"
            >
              <Image
                src={src}
                alt={`Post ${idx}`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110"
                sizes="(max-width: 768px) 33vw, 200px"
              />
            </div>
          ))}
        </div>
      ) : postsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : realPosts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-purple-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 px-6 py-10 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No posts yet. Share your first moment!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {realPosts.map((post, idx) => (
            <div
              key={post.id}
              className="relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-purple-200 to-violet-200"
            >
              {post.image ? (
                <Image
                  src={post.image}
                  alt={`Post ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-110"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <p className="text-xs text-center text-purple-700 dark:text-purple-300 line-clamp-4">{post.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collections Section */}
      <div className="p-6 mt-8 rounded-3xl bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Collections
            </h2>
          </div>
          {user?.id && (
            <span className="text-xs font-semibold text-purple-500 uppercase">
              {collections.length} total
            </span>
          )}
        </div>

        {!user?.id ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to curate postcard collections you can share with friends and family.
          </p>
        ) : (
          <>
            <form
              onSubmit={handleCreateCollection}
              className="grid gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 dark:border-gray-700 dark:bg-gray-900/30"
            >
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Collection name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Summer adventures"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  disabled={isCreating}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="A cozy collection of family postcards..."
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  rows={2}
                  disabled={isCreating}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Visibility
                  </label>
                  <select
                    value={visibilityInput}
                    onChange={(e) => setVisibilityInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    disabled={isCreating}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <FolderPlus className="h-4 w-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
              {createError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
            </form>

            <div className="mt-5 space-y-3">
              {collectionsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading collections…</span>
                </div>
              ) : collectionsError ? (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{collectionsError}</span>
                </div>
              ) : collections.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You haven&apos;t created any collections yet. Start one to group postcards around a theme.
                </p>
              ) : (
                collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between rounded-2xl border border-purple-100 bg-white px-4 py-3 shadow-sm transition-colors hover:border-purple-200 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {collection.visibility && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                          {collection.visibility}
                        </span>
                      )}
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Created{" "}
                        {collection.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Home Circle Section */}
      <div className="p-6 mt-8 rounded-3xl bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Home Circle
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Your closest connections
        </p>
        <div className="flex -space-x-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Image
              key={i}
              src="/diverse-group.png"
              alt={`Circle member ${i}`}
              width={40}
              height={40}
              className="w-10 h-10 border-2 border-white rounded-full object-cover"
            />
          ))}
          <button className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-sky-300 dark:bg-gray-700 flex items-center justify-center text-sky-600 dark:text-sky-300 font-semibold text-sm hover:bg-sky-200 dark:hover:bg-gray-600 transition-colors">
            +12
          </button>
        </div>
      </div>
    </div>
  )
}
