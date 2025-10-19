# HomeBridgr Project & API Overview

This document captures the current HomeBridgr architecture from the UI shell down to the API layer so future contributors can quickly pick up where things stand.

## High-Level Architecture

- **Framework**: Next.js 14 App Router, React 18, Tailwind CSS v4, Geist fonts, lucide-react icons, and shadcn/ui primitives under `components/ui`.
- **Auth & Data**: Supabase provides auth, Postgres, and storage.
  - Client code builds a browser Supabase client (`lib/supabase-browser.ts`) for session checks and direct storage uploads.
  - Server-side API routes rely on the service-role client (`lib/supabase_admin.ts`) for privileged CRUD.
- **AI & Translation**:
  - AWS Bedrock (Anthropic models) through `lib/bedrock.ts` and `lib/analysis.ts` for caption insights.
  - Google Generative AI (Gemini 2.0 Flash) via `/api/translate` for optional UI translations.
- **Fallback Data**: `lib/mock-data.ts` seeds local/mock experiences (discover feed, messaging, initial posts) when live data is unavailable.
- **Testing**: Vitest (`vitest.config.ts`) with route and library level coverage in `__tests__/`.

## Frontend Structure (App Router)

- `app/layout.tsx` - wraps children with `<TranslationProvider>`, loads global styles, and adds Vercel Analytics.
- `app/page.tsx` - client redirect that reads the Supabase session and routes to `/home` or `/login`.
- `app/login/page.tsx` - themed Supabase Auth UI (email/magic-link) that redirects to `/home` on success.
- `app/home/page.tsx` - authenticated shell with top navigation, language/dark-mode toggles, and bottom tab bar that swaps between:
  - **Home view** - `<HomeFeed>` fetches `/api/posts`, falls back to `mockPosts`, and renders `<PostCard>` items which can call `/api/posts/analyze` for caption insights.
  - **Discover view** - `<DiscoverFeed>` backed by `mockLocalPosts` plus `<TopLocationsSidebar>`.
  - **Messages view** - `<MessagingView>` using `mockConversations`.
  - **Profile view** - `<ProfileView>` bound to the signed-in `SessionUser`.
  - **Post Composer** - modal `<PostComposer>` that uploads images to Supabase storage and persists posts through `/api/posts`.

Shared providers and hooks live under `lib/` and `hooks/`, including the translation context/gating logic (`lib/translation-context.tsx`, `lib/use-translated-text.ts`) and viewport helpers.

## Authentication & Session Flow

1. Every client entry point (`app/page.tsx`, `app/home/page.tsx`, `app/login/page.tsx`) instantiates the browser Supabase client via `createSupabaseBrowserClient()`.
2. `supabase.auth.getSession()` decides whether to redirect to `/login` or continue on `/home`.
3. `/login` renders Supabase's `<Auth>` widget; auth state changes trigger a redirect back to `/home`.
4. API routes run with the service-role key (`SUPABASE_SERVICE_KEY`) and must remain server-only.
5. `PostComposer` also uses the browser client to upload images to the `student_uploads` bucket before posting metadata to `/api/posts`.

## Current API Surface (`app/api/*/route.ts`)

| Route | Methods | Description | Key Dependencies |
| --- | --- | --- | --- |
| `/api/posts`<br/>`app/api/posts/route.ts` | `GET`, `POST` | `GET` returns `student_posts` ordered by `created_at` and enriches authors from `profiles`; `POST` validates `caption`/`author_id`, trims optional `image_url`, inserts the row, and returns the created post. | `lib/supabase_admin.ts` |
| `/api/posts/analyze`<br/>`app/api/posts/analyze/route.ts` | `POST` | Accepts `{ postId, options? }`, fetches the post caption, runs `analyzeCaption`, stores `analysis_terms`, `analysis_raw_text`, `analysis_generated_at` back on `student_posts`, and returns both the updated row and AI payload. | `lib/analysis.ts`, `lib/supabase_admin.ts` |
| `/api/analysis`<br/>`app/api/analysis/route.ts` | `POST` | Validates `{ message }`, calls `analyzeCaption`, and returns term explanations. Handles `CaptionAnalysisNotConfiguredError` (501) when Bedrock is not configured. | `lib/analysis.ts` |
| `/api/community/create`<br/>`app/api/community/create/route.ts` | `POST` | Creates a community row and immediately inserts an owner membership in `community_members`; rolls back the community if the membership insert fails. | `lib/supabase_admin.ts` |
| `/api/community/post`<br/>`app/api/community/post/route.ts` | `POST` | Creates community posts (`community_posts`), requiring `communityId`, `authorId`, and at least one of `text`, `linkUrl`, or `imageUrl`. Infers `content_type` when absent. | `lib/supabase_admin.ts` |
| `/api/collections`<br/>`app/api/collections/route.ts` | `GET`, `POST` | `GET` expects `?userId`, returning that user's `postcard_collections`; `POST` trims `name`, `userId`, and optional description/visibility before inserting. | `lib/supabase_admin.ts` |
| `/api/bedrock`<br/>`app/api/bedrock/route.ts` | `POST` | Thin proxy around `invokeBedrockModel` that accepts prompt settings, resolves the model id, calls Bedrock, and returns the raw body. | `lib/bedrock.ts` |
| `/api/translate`<br/>`app/api/translate/route.ts` | `POST` | Sends `{ text, targetLanguage }` to Google Gemini (2.0 Flash) using the official SDK and returns the translated text. | `@google/generative-ai`, `process.env.GEMINI_API_KEY` |

### Supporting Libraries

- `lib/analysis.ts` - builds Bedrock prompts, normalises responses, and surfaces configuration errors.
- `lib/bedrock.ts` - caches the Bedrock runtime client and wraps `InvokeModel`.
- `lib/api/posts.ts` & `lib/api/collections.ts` - browser helpers for calling the corresponding API routes and coercing records into typed objects.
- `lib/supabase_admin.ts` & `lib/supabase-browser.ts` - service-role and browser Supabase clients.
- `lib/translation.ts`, `lib/translation-context.tsx`, `lib/use-translated-text.ts` - translation gating logic used by `<PostTranslation>` and other components.
- `lib/mock-data.ts`, `lib/utils.ts`, `hooks/use-mobile.ts`, `hooks/use-toast.ts` - shared UI data and helpers.

### Test Coverage

- `__tests__/app/api/analysis/route.test.ts` - input validation and Bedrock error handling.
- `__tests__/app/api/posts/route.test.ts` - GET/POST flows against mocked Supabase queries.
- `__tests__/app/api/posts/analyze/route.test.ts` - verifies caption analysis persistence and error paths.
- `__tests__/app/api/community/create/route.test.ts` - ensures owner membership creation and rollback logic.
- `__tests__/app/api/community/post/route.test.ts` - validates required fields, inferred content type, and Supabase errors.
- `__tests__/app/api/collections/route.test.ts` - covers both GET and POST workflows.
- `__tests__/lib/analysis.test.ts` - unit tests prompt construction and Bedrock response parsing.

## Database & Storage Expectations (Supabase)

- `profiles` - author metadata joined by `/api/posts`.
- `student_posts` - primary feed table including `analysis_terms`, `analysis_raw_text`, `analysis_generated_at` columns populated by `/api/posts/analyze`.
- `communities` & `community_members` - created by `/api/community/create`.
- `community_posts` - managed by `/api/community/post`.
- `postcard_collections` - managed by `/api/collections`.
- **Storage**: `student_uploads` bucket for post images uploaded directly from the browser.

Routes currently run with the service-role key, so introduce Row Level Security and scoped access before opening these endpoints publicly.

## Deployment & Configuration Notes

- Mirror `.env.local` variables (Supabase keys, Bedrock credentials, `GEMINI_API_KEY`) into your hosting provider.
- Supabase Auth -> URL configuration must list the deployed domain(s) plus `http://localhost:3000` for local development.
- AWS settings required by the Bedrock helpers: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (or `AWS_BEDROCK_REGION`), and `BEDROCK_MODEL_ID`.
- `npm run bedrock:analyze "sample caption"` is available for local smoke tests once Bedrock is configured.

Keep this document up to date as new routes or integrations land so downstream contributors don't have to rediscover the architecture.
