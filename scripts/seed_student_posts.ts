import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"
import { mockPosts } from "../lib/mock-data"

config({ path: ".env.local", override: false })
config()

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  const authorId = process.env.SEED_POST_AUTHOR_ID

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables."
    )
  }

  if (!authorId) {
    throw new Error(
      "Set SEED_POST_AUTHOR_ID to the profile ID that should own the seeded posts."
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const userPosts = mockPosts.filter((post) => post.type === "user")

  if (!userPosts.length) {
    console.log("No user posts found in mock data. Nothing to seed.")
    return
  }

  if (process.env.SEED_POST_RESET === "true") {
    console.log("Clearing existing posts for author before seeding…")
    const { error } = await supabase
      .from("student_posts")
      .delete()
      .eq("author_id", authorId)
    if (error) {
      throw new Error(`Failed to clear existing posts: ${error.message}`)
    }
  }

  console.log(`Seeding ${userPosts.length} posts for author ${authorId}…`)

  for (const post of userPosts) {
    const caption = post.content.trim()
    const imageUrl = post.image ?? null

    const { error } = await supabase.from("student_posts").insert({
      author_id: authorId,
      caption,
      image_url: imageUrl,
    })

    if (error) {
      console.error("Failed to insert post:", caption)
      console.error(error)
      throw new Error("Aborting seed because an insert failed.")
    }
  }

  console.log("Done! Posts are ready for Bedrock analysis.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
