┌────────────────────────────────────────────┐
│ Browser UI (HomeBridgr client experience)  │
│ - app/home shell with feeds, messaging,    │
│   profile, translation toggles             │
│ - Supabase session checks via @supabase/ssr│
└──────────────┬─────────────────────────────┘
               │ HTTPS (render + fetch /api/*)
               v
┌────────────────────────────────────────────────────────┐
│ Next.js App Router Runtime                              │
│ - Client + server components (app/*)                    │
│ - API routes: /api/posts, /api/posts/analyze,           │
│   /api/analysis, /api/collections, /api/community/*,    │
│   /api/bedrock, /api/translate                          │
│ - Uses service-role Supabase client on the server       │
└───────┬───────────────────────────┬────────────────────┘
        │                           │
        v                           v
┌────────────────────────────────┐  ┌────────────────────────────┐
│ Supabase Platform              │  │ External AI Providers      │
│ - Auth via @supabase/ssr       │  │ - AWS Bedrock (Anthropic)  │
│ - Postgres tables:             │  │   -> caption insight JSON    │
│   profiles                     │  │ - Google Gemini            │
│   student_posts (+analysis fields) │   -> translation API        │
│   communities & community_posts│  └────────────────────────────┘
│   community_members             │
│   postcard_collections          │
│ - Storage bucket: student_uploads│
└────────┬───────────────────────┘
         │
         │ direct uploads + public URLs via browser Supabase client
         v
     Images & assets surfaced in feeds
