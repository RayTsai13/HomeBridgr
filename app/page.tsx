"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push("/login")
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-purple-600">Loading...</div>
    </div>
  )
}
