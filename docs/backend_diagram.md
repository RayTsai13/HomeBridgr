┌──────────────────────────────────────────────────────────┐
│ Next.js API Routes                                        │
├─────────────────────┬─────────────────────────────────────┤
│ Feed & Caption      │ /api/posts            GET, POST -> student_posts |
│ workflow            │ /api/posts/analyze    POST      -> Bedrock + persist |
│                     │ /api/analysis         POST      -> ad-hoc caption AI |
├─────────────────────┼─────────────────────────────────────┤
│ Community           │ /api/community/create POST      -> communities + owner |
│                     │ /api/community/post   POST      -> community_posts     |
├─────────────────────┼─────────────────────────────────────┤
│ Collections         │ /api/collections      GET, POST -> postcard_collections |
├─────────────────────┼─────────────────────────────────────┤
│ AI Utilities        │ /api/bedrock          POST      -> invokeBedrockModel  |
│                     │ /api/translate        POST      -> Google Gemini       |
└─────────────────────┴─────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Supabase data touched                                     │
├──────────────────────────────┬────────────────────────────┤
│ Tables                       │ Buckets                    │
├──────────────────────────────┼────────────────────────────┤
│ profiles                     │ student_uploads            │
│ student_posts (analysis_* columns) │                       │
│ communities                  │                            │
│ community_members            │                            │
│ community_posts              │                            │
│ postcard_collections         │                            │
└──────────────────────────────┴────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ External dependencies                                     │
├──────────────────────┬────────────────────────────────────┤
│ AWS Bedrock          │ lib/bedrock.ts + lib/analysis.ts   │
│ Google Generative AI │ app/api/translate (Gemini 2.0 Flash)│
└──────────────────────┴────────────────────────────────────┘
