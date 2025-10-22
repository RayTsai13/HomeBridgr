# HomeBridgr Technical Documentation

This guide consolidates the project knowledge previously scattered across multiple docs. It is the single source of truth for architecture, data flow, APIs, integrations, and developer workflows.

## Project Snapshot
- **Framework**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS v4, shadcn/ui primitives, Geist font family, lucide-react icons.
- **State & Data**: Supabase handles authentication, Postgres, and object storage. The browser uses the anon client, while API routes use a service-role client.
- **AI & Language**: AWS Bedrock (Anthropic Claude family) powers caption analysis via `lib/analysis.ts`; Google Gemini Flash backs `/api/translate` for optional UI translations.
- **Testing**: Vitest drives unit and API route coverage. Existing specs live in `__tests__/`.
- **Fallbacks**: `lib/mock-data.ts` seeds feeds, messaging, and discover pages when Supabase data is unavailable.
- **Tooling**: Lightning CSS (via Tailwind v4), TSX for scripts, shadcn component library, Vercel Analytics.

## Architecture Overview

```text
┌──────────────────────────────────────────────┐
│ Browser UI (Next.js app)                     │
│ - Supabase session checks via browser client │
│ - Home shell: feed, discover, messages,      │
│   profile, translations, composer            │
└──────────────┬───────────────────────────────┘
               │ HTTPS (SSR + /api/* fetches)
               ▼
┌─────────────────────────────────────────────────────────┐
│ Next.js App Router Runtime                              │
│ - Client & server components under `app/`               │
│ - API routes (see table below)                          │
│ - Uses service-role Supabase client on the server       │
└───────┬───────────────────────────┬────────────────────┘
        │                           │
        ▼                           ▼
┌─────────────────────────────┐     ┌──────────────────────────────┐
│ Supabase Platform           │     │ External AI Providers        │
│ - Auth (email magic links)  │     │ - AWS Bedrock (Anthropic)    │
│ - Postgres tables & views   │     │   → caption insights JSON    │
│ - Storage bucket            │     │ - Google Gemini Flash        │
└─────────┬──────────────────┘     │   → translation API          │
          │                        └──────────────────────────────┘
          │ signed uploads + public URLs
          ▼
      `student_uploads` bucket
```

### Flow Highlights
- **Authentication**: Every entry point (`app/page.tsx`, `/home`, `/login`) instantiates the browser Supabase client and decides whether to redirect. The Supabase Auth UI handles sign-in via email magic links.
- **Data Access**: API routes call `createSupabaseAdminClient()` (`lib/supabase_admin.ts`) with the service-role key. These endpoints must remain server-only until Row Level Security is enabled.
- **Caption Insights**: Posts call `/api/posts/analyze` to run `analyzeCaption()` against AWS Bedrock. Community posts use `/api/community/post/analyze`.
- **Translations**: `/api/translate` proxies Google Gemini to translate captions or UI strings on demand.
- **Fallback UX**: If Supabase queries fail, the frontend switches to curated mock data for feeds, discover, and messaging.

## Frontend Experience
- `app/layout.tsx` wraps children with `<TranslationProvider>`, injects global styles (`app/globals.css`), and registers Vercel Analytics.
- `app/page.tsx` determines whether to push users to `/home` (signed-in) or `/login` (anon).
- `app/login/page.tsx` renders Supabase Auth UI themed via ThemeSupa and redirects back to `/home` after authentication.
- `app/home/page.tsx` is the authenticated shell. A view state swaps between:
  - **Home (community)**: `<HomeFeed userType="community">` fetches `/api/posts?viewerId=<id>&userType=community`, falling back to `mockPosts`.
  - **Home (student)**: `<HomeFeed userType="student">` loads student posts without mock fallback.
  - **Discover**: `<DiscoverFeed>` + `<TopLocationsSidebar>` from mock data.
  - **Messages**: `<MessagingView>` seeded by `mockConversations`.
  - **Profile**: `<ProfileView>` sourced from the signed-in Supabase profile.
  - **Post Composer**: Modal `<PostComposer>` uploads images via the browser client to `student_uploads` and persists metadata through `/api/posts`.
- Support utilities:
  - `lib/translation-context.tsx` + `lib/use-translated-text.ts` gate translation calls and spinner state.
  - `lib/api/posts.ts`, `lib/api/collections.ts` wrap fetch calls to simplify client usage.
  - `hooks/use-mobile.ts`, `hooks/use-toast.ts` manage responsive layout and notifications.
  - `components/ui/*` houses shadcn-derived primitives.

## API Surface

| Route | Methods | Purpose | Key Modules |
| --- | --- | --- | --- |
| `/api/posts` | GET, POST | GET returns community or student feeds (requires `viewerId`, optional `userType`). POST validates caption/image, inserts into `student_posts`, and enriches response. | `lib/supabase_admin.ts` |
| `/api/posts/analyze` | POST | Fetches a post caption, calls `analyzeCaption()`, stores `analysis_terms`, `analysis_raw_text`, `analysis_generated_at`. | `lib/analysis.ts`, `lib/supabase_admin.ts` |
| `/api/analysis` | POST | Accepts a free-form caption and returns Bedrock explanations without mutating data. | `lib/analysis.ts` |
| `/api/community/create` | POST | Creates a community row, then an owner membership; rolls back if membership fails. | `lib/supabase_admin.ts` |
| `/api/community/post` | POST | Persists community posts, infers `content_type`, and enforces at least one content field. | `lib/supabase_admin.ts` |
| `/api/community/post/analyze` | POST | Runs caption analysis on community text posts and updates analysis columns. | `lib/analysis.ts`, `lib/supabase_admin.ts` |
| `/api/collections` | GET, POST | Manages `postcard_collections`, including creation with optional description/visibility. | `lib/supabase_admin.ts` |
| `/api/profiles` | GET, PATCH | GET returns the viewer’s profile; PATCH upserts `user_type` and other profile fields. | `lib/supabase_admin.ts` |
| `/api/bedrock` | POST | Thin proxy to `invokeBedrockModel()` for custom Bedrock calls. | `lib/bedrock.ts` |
| `/api/translate` | POST | Sends `{ text, targetLanguage }` to Google Gemini Flash and returns translated text. | `@google/generative-ai` |

### Supporting Libraries
- `lib/analysis.ts` normalises Claude responses, enforces JSON shape, and surfaces configuration errors via `CaptionAnalysisNotConfiguredError`.
- `lib/bedrock.ts` caches the Bedrock runtime client and wraps `InvokeModel`.
- `lib/supabase_admin.ts` and `lib/supabase_client.ts` create service-role and browser Supabase clients.
- `lib/mock-data.ts` provides deterministic data for feeds, discover, messaging, and top locations.
- `lib/utils.ts` and helper hooks abstract viewport behaviour, toast notifications, and date formatting.

## Data & Storage Model

### Core Tables
- **profiles**: Author metadata joined with posts. Fields include `display_name`, `username`, `avatar_url`, `bio`, `location`, `user_type`, and timestamps.
- **student_posts**: Primary feed table with `caption`, `image_url`, `author_id`, analytics (`analysis_terms`, `analysis_raw_text`, `analysis_generated_at`), optional engagement metrics, and `created_at`.
- **communities**: Community definitions with `name`, `slug`, `description`, `created_by`, `created_at`.
- **community_members**: Membership records keyed by `community_id`, `member_id`, and `role`.
- **community_posts**: Community feed entries with inferred `content_type` (`text`, `link`, or `image`), optional `text_content`, `link_url`, `image_url`, and the same analysis fields as student posts.
- **postcard_collections**: Saved collections with `name`, `description`, `visibility`, `created_by`, `items` (JSON payload), `post_ids`, `fingerprint`, and `metadata`. Supporting SQL lives in `docs/sql/postcard_collections.sql`.

### Storage
- **Bucket `student_uploads`**: Accepts authenticated uploads from the browser Supabase client (used by the post composer). Ensure public read access for serving images in feeds.

### Relationships & Policies
- Foreign keys should link all `*_id` columns to the canonical user or community records.
- Row Level Security is currently not enforced; before production launch, add policies that scope reads to permitted users and restrict writes to owners.
- Indexes on `student_posts.created_at` and `community_posts.created_at` keep feed queries efficient.

## Authentication & Session Flow
- The browser client (`lib/supabase_client.ts`) handles session checks and image uploads.
- API routes run with the service-role key (`SUPABASE_SERVICE_KEY`); never expose this key outside server contexts.
- `app/page.tsx` uses `supabase.auth.getSession()` to determine whether to redirect to `/home` or `/login`.
- Successful authentication in `/login` triggers a redirect back to `/home`.

## AI & Language Features
- `analyzeCaption()` builds a structured prompt for Claude via Bedrock and expects strict JSON containing `{ terms: [{ term, explanation }] }`.
- Configuration errors throw `CaptionAnalysisNotConfiguredError`, which maps to HTTP 501 in API routes.
- `/api/translate` uses the official Google Generative AI SDK; inputs require `text` and `targetLanguage` ISO code.
- CLI smoke test: `npm run bedrock:analyze -- "Sample caption"` (after configuring Bedrock variables).

## Configuration & Environment
Create a `.env.local` (excluded from git) with the following keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
AWS_ACCESS_KEY_ID=<bedrock-iam-access-key>
AWS_SECRET_ACCESS_KEY=<bedrock-iam-secret-key>
AWS_REGION=<aws-region>             # e.g. us-west-2
AWS_BEDROCK_REGION=<bedrock-region> # optional override
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
GEMINI_API_KEY=<google-generative-ai-key>
```

Mirror these values in your hosting provider’s environment settings. If you assume IAM roles with temporary credentials, add `AWS_SESSION_TOKEN`.

## Local Development Workflow
- Install dependencies: `npm install` (include optional deps so Lightning CSS binaries install correctly).
- Run the web app: `npm run dev` → http://localhost:3000
- Type checking: `npm run type-check`
- Linting: `npm run lint`
- Tests: `npm test` (Vitest)
- Seed sample posts: `npm run seed:posts` executes `scripts/seed_student_posts.ts` against Supabase.

### Handy Scripts
- `npm run bedrock:analyze` → `scripts/run_bedrock_analysis.ts` for CLI caption analysis.
- `npx tsx scripts/call_analysis_route.ts` hits `/api/analysis` with sample payloads.
- `npm run seed:posts` populates `student_posts` when using a local Supabase instance.

## Testing & Quality Assurance
- API route coverage: `__tests__/app/api/*/*.test.ts` validate validation guards, Supabase interactions, and AI integration error paths for posts, community posts, collections, profiles, and the Bedrock proxy.
- Library coverage: `__tests__/lib/analysis.test.ts` checks prompt construction and JSON parsing resiliency.
- When adding new endpoints, mirror existing test patterns (mock Supabase responses with Vitest) to maintain parity.

## Deployment Notes
- Recommended target: Vercel. Ensure optional dependencies are installed (`npm install --include=optional` or set `NPM_CONFIG_INCLUDE=optional`) so Tailwind’s Lightning CSS binary is available.
- Keep the optional dependency `lightningcss-linux-x64-gnu@1.30.1` in `package.json`; its lockfile metadata guarantees the Linux binary is present during Vercel builds.
- Sync `.env` values (Supabase keys, AWS credentials, Gemini key) into the deployment environment.
- Update Supabase Auth → Redirect URLs to include both local dev (`http://localhost:3000`) and deployed domains.
- Introduce Row Level Security before exposing service-role backed routes beyond trusted environments.

## Mock & Seed Data Strategy
- `lib/mock-data.ts` drives discover cards, messaging threads, and fallback posts when Supabase is unavailable. Keep it updated to match the latest UI expectations.
- The seed script (`scripts/seed_student_posts.ts`) is safe to rerun; it creates sample posts for a given user to accelerate demo environments.

## Future Enhancements & Gaps
- Add RLS policies with PostgREST functions or edge functions to remove reliance on the service-role key.
- Expand test coverage to UI components (React Testing Library) and end-to-end flows (Playwright).
- Instrument analytics beyond Vercel (e.g., server timing, error tracking).
- Consider splitting translation costs by caching previously translated captions.

## Reference Assets
- Supabase SQL: `docs/sql/postcard_collections.sql`
- Bedrock example usage: `scripts/run_bedrock_analysis.ts`
- Supabase admin utilities: `lib/supabase_admin.ts`

Keep this document current whenever APIs, schemas, or workflows change so new contributors can ramp quickly.
