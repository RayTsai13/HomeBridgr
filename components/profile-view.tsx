"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  Settings,
  MapPin,
  Users,
  Folder,
  FolderPlus,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { currentUser, mockPosts } from "@/lib/mock-data"
import type { SessionUser, Collection } from "@/lib/types"
import { fetchCollections, createCollection } from "@/lib/api/collections"

interface ProfileViewProps {
  user: SessionUser | null
}

export function ProfileView({ user }: ProfileViewProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [nameInput, setNameInput] = useState("")
  const [descriptionInput, setDescriptionInput] = useState("")
  const [visibilityInput, setVisibilityInput] = useState("private")

  const profileInfo = useMemo(() => {
    const fallback = currentUser
    const displayName =
      user?.displayName ??
      user?.email?.split("@")[0] ??
      fallback.displayName
    const username =
      user?.email?.split("@")[0] ??
      fallback.username

    return {
      displayName,
      username,
      email: user?.email ?? null,
      avatar: user?.avatarUrl ?? fallback.avatar,
      bio: fallback.bio,
      hometown: fallback.hometown,
      location: fallback.location,
    }
  }, [user])

  const userPosts = useMemo(
    () =>
      mockPosts.filter(
        (post) =>
          post.type === "user" && post.author.id === currentUser.id
      ),
    []
  )

  const galleryImages = [
    "/raymond_pic1.jpg?height=300&width=300",
    "/raymond_pic2.jpg?height=300&width=300",
    "/raymond_pic3.jpg?height=300&width=300",
    "/raymond_pic4.jpg?height=300&width=300",
    "/raymond_pic5.jpg?height=300&width=300",
    "/raymond_pic6.jpg?height=300&width=300",
  ]

  useEffect(() => {
    if (!user?.id) {
      setCollections([])
      setCollectionsError("Sign in to create postcard collections.")
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
  }, [user?.id])

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

  return (
    <div className="max-w-2xl px-4 py-6 mx-auto">
      {/* Header with gradient background */}
      <div className="gradient-purple-soft dark:bg-gradient-to-br dark:from-cyan-900 dark:to-cyan-700 rounded-3xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <button className="flex items-center justify-center w-10 h-10 transition-colors rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{profileInfo.displayName}</h1>
          <p className="text-purple-600 dark:text-sky-300 font-medium mb-3">@{profileInfo.username}</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">{profileInfo.bio}</p>

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
                {userPosts.length}
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
        <button className="flex-1 py-3 font-semibold text-white transition-all rounded-2xl gradient-purple hover:shadow-lg">
          Edit Profile
        </button>
        <button className="flex-1 py-3 font-semibold transition-colors rounded-2xl bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-gray-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700">
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
      <div className="grid grid-cols-3 gap-2">
        {galleryImages.map((src, idx) => (
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
