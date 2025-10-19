"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function Page() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    const routeToDestination = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.replace("/home")
      } else {
        router.replace("/login")
      }
    }

    routeToDestination()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-purple-600">Loading...</div>
    </div>
  )
}
