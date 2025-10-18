┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js API Routes                          │
├─────────────────────────────┬───────────────────────────────────────┤
│ /api/posts/create           │ Creates student_post, uploads image   │
│ /api/posts/analyze          │ Fetches post → calls Bedrock → saves  │
│ /api/community/create       │ Create community + membership         │
│ /api/community/post         │ Add community_post (link/text/image)  │
│ /api/collections/create     │ Make postcard collection              │
│ /api/postcards/generate     │ Query posts → render HTML→PNG/PDF     │
│ /api/postcards/share-link   │ Create public read-only link          │
└─────────────────────────────┴───────────────────────────────────────┘

┌─────────────────────────┐     ┌───────────────────────────┐
│ Supabase (Postgres +    │     │ Supabase Storage          │
│ RLS policies)           │     │ - /student_uploads        │
│ - profiles              │     │ - /community_uploads      │
│ - student_posts         │     │ - /postcards              │
│ - community_posts       │     └───────────────────────────┘
│ - communities           │
│ - community_members     │     ┌───────────────────────────┐
│ - postcard_collections  │     │ AWS Bedrock Runtime       │
│ - postcards             │     │ - Claude/Llama via SDK    │
│ - follows               │     │ - JSON in/out             │
└──────────┬──────────────┘     └───────────┬───────────────┘
           │                                  │
           v                                  v
   ┌──────────────┐                    ┌───────────────┐
   │ Supabase Auth│                    │ Puppeteer Core│
   │ - Email OTP  │                    │ - SSR postcard│
   └──────────────┘                    │ - upload URLs │
                                       └───────────────┘
