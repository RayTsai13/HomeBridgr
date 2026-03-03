import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local", override: false })
config()

const DEMO_USERS = [
  {
    email: "wei@homebridgr.demo",
    name: "Wei Chen",
    avatar_url: "/raymond.jpg",
    user_type: "student",
    bio: "UW Freshman",
    location: "Seattle, WA",
    envKey: "SEED_USER_ID_WEI",
  },
  {
    email: "mom@homebridgr.demo",
    name: "Mom",
    avatar_url: "/mom.jpg",
    user_type: "community",
    bio: "Your loving mom",
    location: "Taoyuan, Taiwan",
    envKey: "SEED_USER_ID_MOM",
  },
  {
    email: "dad@homebridgr.demo",
    name: "Dad",
    avatar_url: "/dad.jpg",
    user_type: "community",
    bio: "Your proud dad",
    location: "Taoyuan, Taiwan",
    envKey: "SEED_USER_ID_DAD",
  },
  {
    email: "sarah@homebridgr.demo",
    name: "Cousin Sarah",
    avatar_url: "/diverse-woman-smiling.png",
    user_type: "community",
    bio: "Coffee lover and photographer",
    location: "Seattle, WA",
    envKey: "SEED_USER_ID_SARAH",
  },
  {
    email: "emma@homebridgr.demo",
    name: "Emma Wilson",
    avatar_url: "/person-friendly.jpg",
    user_type: "student",
    bio: "Designer & artist",
    location: "Seattle, WA",
    envKey: "SEED_USER_ID_EMMA",
  },
  {
    email: "becca@homebridgr.demo",
    name: "Becca Caulton",
    avatar_url: "/becca-caulton.jpg",
    user_type: "student",
    bio: "Electrical Computer Engineer!",
    location: "Seattle, WA",
    envKey: "SEED_USER_ID_BECCA",
  },
  {
    email: "jonathan@homebridgr.demo",
    name: "Jonathan Chu",
    avatar_url: "/jonathan.jpg",
    user_type: "student",
    bio: "Computer Science Wiz",
    location: "UWB",
    envKey: "SEED_USER_ID_JONATHAN",
  },
] as const

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables."
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log("Seeding demo users...\n")

  const results: Record<string, string> = {}

  for (const user of DEMO_USERS) {
    // Check if user already exists by listing users and finding by email
    const { data: listData, error: listError } =
      await supabase.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const existing = listData.users.find((u) => u.email === user.email)

    let userId: string

    if (existing) {
      console.log(`  [skip] ${user.email} already exists — UUID: ${existing.id}`)
      userId = existing.id
    } else {
      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: { full_name: user.name },
          password: `HomeBridgr_${Math.random().toString(36).slice(2)}`,
        })

      if (createError || !created.user) {
        throw new Error(
          `Failed to create user ${user.email}: ${createError?.message ?? "unknown error"}`
        )
      }

      userId = created.user.id
      console.log(`  [created] ${user.email} — UUID: ${userId}`)
    }

    // Upsert profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        user_type: user.user_type,
        display_name: user.name,
      },
      { onConflict: "id" }
    )

    if (profileError) {
      throw new Error(
        `Failed to upsert profile for ${user.email}: ${profileError.message}`
      )
    }

    results[user.envKey] = userId
  }

  console.log("\nDone! Copy these into your .env.local:\n")
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}=${value}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
