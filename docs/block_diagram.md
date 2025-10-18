┌───────────────────┐                             ┌──────────────────────┐
│   Student (web)   │                             │ Community (web)      │
│  Next.js frontend │                             │ Next.js frontend     │
└─────────┬─────────┘                             └──────────┬───────────┘
          │ HTTP(S)                                              │ HTTP(S)
          v                                                      v
                  ┌──────────────────────────────────────────┐
                  │         Next.js App Router (SSR)         │
                  │  - UI pages & API routes (/api/*)        │
                  │  - shadcn/ui + Tailwind                  │
                  └───────────┬──────────────────────────────┘
                              │ Server-to-server calls
   ┌──────────────────────────┼───────────────────────────┐
   v                          v                           v
┌──────────────┐        ┌──────────────┐            ┌──────────────────┐
│  Supabase    │        │  Bedrock AI  │            │  Postcard Render │
│  (Auth/DB)   │        │ (Claude etc) │            │ (Puppeteer/SSR)  │
│  - Auth      │        │ - Term/def   │            │ - HTML→PNG/PDF   │
│  - Postgres  │        │ - Summaries  │            │ - Stored output  │
│  - Storage   │        └───────┬──────┘            └─────────┬────────┘
└──────┬───────┘                │                               │
       │ SQL/Storage            │ JSON                          │ File URLs
       v                        v                               v
┌──────────────┐        ┌──────────────┐            ┌──────────────────┐
│  RLS-secured │        │  AI Results  │            │ Supabase Storage │
│  tables      │        │  (terms/expl)│            │ (images, postcards)
└──────────────┘        └──────────────┘            └──────────────────┘

                           ┌─────────────────────────────┐
                           │ Optional: Scheduler/Email   │
                           │ - Supabase cron or edge fn  │
                           │ - Resend (email postcards)  │
                           └─────────────────────────────┘
