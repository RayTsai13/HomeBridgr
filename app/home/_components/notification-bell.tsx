"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import type { Notification } from "@/lib/types"

interface NotificationBellProps {
  userId: string | null
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function notificationText(n: Notification): string {
  switch (n.type) {
    case "like":
      return `${n.actorName} liked your post`
    case "follow":
      return `${n.actorName} started following you`
    case "comment":
      return `${n.actorName} commented on your post`
    default:
      return `${n.actorName} interacted with you`
  }
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`)
      if (!res.ok) return
      const data = await res.json()
      const parsed: Notification[] = (data.notifications ?? []).map((n: Notification & { createdAt: string | Date }) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }))
      setNotifications(parsed)
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // silently fail
    }
  }, [userId])

  useEffect(() => {
    void fetchNotifications()
    intervalRef.current = setInterval(() => void fetchNotifications(), 60_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchNotifications])

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && userId && unreadCount > 0) {
      setUnreadCount(0)
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      } catch {
        // silently fail
      }
    }
  }

  if (!userId) {
    return (
      <button
        onClick={() => toast({ description: "Sign in to see notifications." })}
        className="relative flex items-center justify-center bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600 text-purple-400 dark:text-purple-300 p-2 rounded-lg text-sm font-medium transition-colors border border-purple-200 dark:border-gray-600"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
      </button>
    )
  }

  return (
    <Popover open={open} onOpenChange={(v: boolean) => void handleOpen(v)}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600 text-purple-400 dark:text-purple-300 p-2 rounded-lg text-sm font-medium transition-colors border border-purple-200 dark:border-gray-600"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-800">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${
                  !n.read ? "bg-purple-50/50 dark:bg-purple-900/10" : ""
                }`}
              >
                <Image
                  src={n.actorAvatar || "/placeholder-user.jpg"}
                  alt={n.actorName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {notificationText(n)}
                  </p>
                  {n.postCaption && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{n.postCaption}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
