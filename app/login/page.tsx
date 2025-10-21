"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import type { Session } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { DEMO_MODE_STORAGE_KEY, DEMO_MODE_QUERY_PARAM } from "@/lib/demo-mode"

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [redirectTo, setRedirectTo] = useState<string>()
  const [needsUserType, setNeedsUserType] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserType, setSelectedUserType] = useState<
    "student" | "community" | null
  >(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const USER_TYPE_STORAGE_KEY = "hb_selected_user_type"

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(USER_TYPE_STORAGE_KEY)
    if (stored === "student" || stored === "community") {
      setSelectedUserType(stored)
    }
  }, [])
  const submitUserType = useCallback(async () => {
    if (!userId || !selectedUserType) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userType: selectedUserType,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.details ?? body?.error ?? "Failed")
      }

      setNeedsUserType(false)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(USER_TYPE_STORAGE_KEY)
      }
      router.replace("/home")
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save your choice. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [router, selectedUserType, userId])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectTo(`${window.location.origin}/home`)
    }
  }, [])

  const handleDemoTour = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, "1")
    }
    router.push(`/home?${DEMO_MODE_QUERY_PARAM}=1`)
  }, [router])

  const handleSession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setNeedsUserType(false)
        setUserId(null)
        setSubmitError(null)
        setProfileError(null)
        setSelectedUserType(null)
        return
      }

      setUserId(session.user.id)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DEMO_MODE_STORAGE_KEY)
      }

      try {
        const response = await fetch(
          `/api/profiles?userId=${encodeURIComponent(session.user.id)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        )

        const body = (await response.json().catch(() => ({}))) as {
          profile?: { user_type?: string | null } | null
          error?: string
          details?: string
        }

        if (!response.ok) {
          throw new Error(
            body?.details ??
              body?.error ??
              "We couldn't check your profile right now. Please try again."
          )
        }

        if (body.profile?.user_type) {
          setNeedsUserType(false)
          router.replace("/home")
          return
        }

        setProfileError(null)
        setSubmitError(null)
        setNeedsUserType(true)
        // If a preference was chosen pre-auth, submit it immediately
        if (
          (selectedUserType === "student" || selectedUserType === "community") &&
          !isSubmitting
        ) {
          await submitUserType()
          return
        }
      } catch (error) {
        console.error("Failed to load profile", error)
        setNeedsUserType(false)
        setProfileError(
          error instanceof Error
            ? error.message
            : "We couldn't check your profile right now. Please try again."
        )
        setSubmitError(null)
      }
    },
    [router, isSubmitting, selectedUserType, submitUserType]
  )

  useEffect(() => {
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      await handleSession(session)
    }

    void syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void handleSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [handleSession, supabase])

/* -----------------------------------login page design*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-sky-200 to-purple-300 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-sky-600 bg-clip-text text-transparent">
            HomeBridgr
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in or create an account to continue
          </p>
        </div>
        <div className="bg-white border border-purple-100 shadow-sm rounded-2xl p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#c37fd3ff",
                    brandAccent: "#bb47bfff",
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={redirectTo}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email address",
                },
              },
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleDemoTour}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-purple-300 bg-white/70 px-4 py-3 text-sm font-semibold text-purple-600 transition hover:border-purple-400 hover:bg-white"
        >
          Explore a live demo
        </button>
        {profileError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 space-y-3">
            <p className="text-sm">{profileError}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                onClick={() => {
                  setProfileError(null)
                  void (async () => {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession()
                    await handleSession(session)
                  })()
                }}
              >
                Retry
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                onClick={() => {
                  router.replace("/home")
                }}
              >
                Continue without setting role
              </button>
            </div>
          </div>
        ) : null}
        <div className="bg-white border border-purple-100 shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Choose how you&apos;ll use HomeBridgr
          </h2>
          <p className="text-sm text-gray-600">
            Pick one. We&apos;ll save it automatically after you sign in.
          </p>
          {submitError ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSubmitError(null)
                setSelectedUserType((current) => {
                  const next = current === "student" ? null : "student"
                  if (typeof window !== "undefined") {
                    if (next) {
                      window.localStorage.setItem(USER_TYPE_STORAGE_KEY, next)
                    } else {
                      window.localStorage.removeItem(USER_TYPE_STORAGE_KEY)
                    }
                  }
                
                  // If already signed in and need type, apply immediately
                  if (next && needsUserType && userId && !isSubmitting) {
                    void submitUserType()
                  }
                  return next
                })
              }}
              className={`rounded-xl border px-4 py-3 text-left transition disabled:opacity-50 ${
                selectedUserType === "student"
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
              }`}
            >
              <span className="block text-base font-medium text-gray-900">
                I’m a student
              </span>
              <span className="mt-1 block text-sm text-gray-600">
                Connect with family and share campus life updates.
              </span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSubmitError(null)
                setSelectedUserType((current) => {
                  const next = current === "community" ? null : "community"
                  if (typeof window !== "undefined") {
                    if (next) {
                      window.localStorage.setItem(USER_TYPE_STORAGE_KEY, next)
                    } else {
                      window.localStorage.removeItem(USER_TYPE_STORAGE_KEY)
                    }
                  }
                  if (next && needsUserType && userId && !isSubmitting) {
                    void submitUserType()
                  }
                  return next
                })
              }}
              className={`rounded-xl border px-4 py-3 text-left transition disabled:opacity-50 ${
                selectedUserType === "community"
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
              }`}
            >
              <span className="block text-base font-medium text-gray-900">
                I’m community
              </span>
              <span className="mt-1 block text-sm text-gray-600">
                Coordinate updates and stay close with students.
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-500">
            You can update this later by contacting support.
          </p>
        </div>
      </div>
    </div>
  )
}
