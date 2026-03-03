import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local", override: false })
config()

// Posts to seed — each mapped to the env var holding the author's UUID.
// Run `npm run seed:users` first and copy the printed UUIDs into .env.local.
const SEED_POSTS: Array<{
  caption: string
  image_url: string | null
  authorEnvKey: string
}> = [
  {
    caption: "Beautiful sunset at alki beach today! The aurora borealis was absolutely stunning.",
    image_url: "/sunset-beach-tranquil.png",
    authorEnvKey: "SEED_USER_ID_DAD",
  },
  {
    caption: "Just finished my new art piece! I modelled it after Michaelangelo. What do you think?",
    image_url: "/abstract-composition.png",
    authorEnvKey: "SEED_USER_ID_SARAH",
  },
  {
    caption: "Coffee and coding - perfect morning combo",
    image_url: "/coffee-laptop.jpg",
    authorEnvKey: "SEED_USER_ID_EMMA",
  },
  {
    caption: "Anyone down to carpool to Snoqualmie Falls this weekend? I live in UDistrict and can drive!",
    image_url: "/snoqualmie_falls.jpg",
    authorEnvKey: "SEED_USER_ID_BECCA",
  },
  {
    caption: "Did a super fun hike this weekend and it's not too far from Seattle!",
    image_url: "/pacific_crest.jpg",
    authorEnvKey: "SEED_USER_ID_JONATHAN",
  },
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables."
    )
  }

  // Validate all required UUIDs before inserting
  const missingKeys: string[] = []
  for (const post of SEED_POSTS) {
    if (!process.env[post.authorEnvKey]) {
      missingKeys.push(post.authorEnvKey)
    }
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required env vars: ${missingKeys.join(", ")}\n` +
      "Run `npm run seed:users` first and copy the printed UUIDs into .env.local."
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  if (process.env.SEED_POST_RESET === "true") {
    console.log("Clearing existing demo posts before seeding…")
    const authorIds = SEED_POSTS.map((p) => process.env[p.authorEnvKey]).filter(Boolean)
    const { error } = await supabase
      .from("student_posts")
      .delete()
      .in("author_id", authorIds)
    if (error) {
      throw new Error(`Failed to clear existing posts: ${error.message}`)
    }
  }

  console.log(`Seeding ${SEED_POSTS.length} posts…\n`)

  for (const post of SEED_POSTS) {
    const authorId = process.env[post.authorEnvKey]!

    const { error } = await supabase.from("student_posts").insert({
      author_id: authorId,
      caption: post.caption,
      image_url: post.image_url,
    })

    if (error) {
      console.error(`Failed to insert post for ${post.authorEnvKey}:`, post.caption)
      console.error(error)
      throw new Error("Aborting seed because an insert failed.")
    }

    console.log(`  [ok] ${post.authorEnvKey}: "${post.caption.slice(0, 50)}…"`)
  }

  console.log("\nDone! Posts are ready for Bedrock analysis.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
