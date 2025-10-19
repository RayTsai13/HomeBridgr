"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [redirectTo, setRedirectTo] = useState<string>()

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectTo(`${window.location.origin}/home`)
    }
  }, [])

  useEffect(() => {
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.replace("/home")
      }
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/home")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
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
                    brand: "#6b21a8",
                    brandAccent: "#7c3aed",
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
      </div>
    </div>
  )
}
