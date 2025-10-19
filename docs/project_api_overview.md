# HomeBridgr Project & API Overview

This document captures the current state of the HomeBridgr codebase so you can hand the context to another assistant (or future you) when planning the API layer. It walks from the 10,000‑ft view down to the implementation details, with an emphasis on what exists today inside `app/api` and the supporting libraries.

## High-Level Architecture

- **Framework**: Next.js 14 App Router with client/server components, Tailwind CSS, Geist fonts, and shadcn/ui primitives for UI.
- **Auth & Data**: Supabase provides authentication, Postgres, and storage. The project uses:
  - the Supabase browser client for session-aware components (`lib/supabase-browser.ts`);
  - the Supabase service-role client for server-side CRUD (`lib/supabase_admin.ts`).
- **AI Integrations**:
  - AWS Bedrock (Anthropic Claude) via `lib/bedrock.ts`;
  - Google Generative AI (Gemini) for translations via `app/api/translate`.
- **Testing**: Vitest unit tests (`__tests__/`), especially for `/api/analysis`.

## Frontend Structure (Next.js App Router)

- `app/layout.tsx` – global layout, fonts, analytics.
- `app/page.tsx` – landing redirect that routes users to `/home` or `/login` based on Supabase session.
- `app/login/page.tsx` – Supabase Auth UI component (email/magic-link) for sign-in/up.
- `app/home/page.tsx` – main authenticated shell (feeds, sidebars, messaging) guarded by Supabase session checks.
- Global styling lives in `app/globals.css`; additional reusable components are under `components/`.

## Authentication Flow

1. `/login` renders Supabase’s `<Auth>` widget. Sessions are managed client-side with `@supabase/ssr`’s browser client.
2. Root and home pages call `supabase.auth.getSession()` to redirect unauthenticated users to `/login`.
3. Server-side API routes use the service-role key (`SUPABASE_SERVICE_KEY`) via `lib/supabase_admin.ts`; keep this server-only.
4. Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.) are defined in `.env.local` and must be mirrored in production.

## Current API Surface (`app/api/*/route.ts`)

| Route | Methods | Description | Key Dependencies |
| --- | --- | --- | --- |
| `/api/posts`<br/>`app/api/posts/route.ts` | `GET`, `POST` | Fetches and creates records in the `student_posts` table. `GET` joins against the `profiles` table to return author details. `POST` validates `caption`, `author_id`, optional `image_url`, inserts the row, and returns the created post. | `lib/supabase_admin.ts` (service client) |
| `/api/posts/analyze`<br/>`app/api/posts/analyze/route.ts` | `POST` | Accepts `{ postId, options? }`, loads the post, runs `analyzeCaption`, and persists the structured analysis (`analysis_terms`, `analysis_raw_text`, `analysis_generated_at`) back to `student_posts`. | `lib/analysis.ts`, `lib/supabase_admin.ts` |
| `/api/community/create`<br/>`app/api/community/create/route.ts` | `POST` | Creates a community row and the creator’s owner membership in `community_members`. Validates `name` and `creatorId`, inserts the records, and rolls back the community if membership creation fails. | `lib/supabase_admin.ts` |
| `/api/community/post`<br/>`app/api/community/post/route.ts` | `POST` | Inserts a new community post record, requiring `communityId`, `authorId`, and at least one content field (`text`, `linkUrl`, `imageUrl`). Determines the `content_type` automatically when not provided. | `lib/supabase_admin.ts` |
| `/api/collections`<br/>`app/api/collections/route.ts` | `POST` | Creates a postcard collection with `name` and `userId` (creator). Optional `description` and `visibility` values are trimmed and stored if supplied. | `lib/supabase_admin.ts` |
| `/api/analysis`<br/>`app/api/analysis/route.ts` | `POST` | Accepts `{ message }`, validates input, and calls `lib/analysis.analyzeCaption`. Returns the AI result or surfaces configuration errors (501 when Bedrock credentials missing). | `lib/analysis.ts` (wraps Bedrock) |
| `/api/bedrock`<br/>`app/api/bedrock/route.ts` | `POST` | Thin proxy to AWS Bedrock. Builds the Anthropic payload, merges defaults (model id/tokens), invokes `invokeBedrockModel`, and returns the raw JSON body. | `lib/bedrock.ts` |
| `/api/translate`<br/>`app/api/translate/route.ts` | `POST` | Accepts `{ text, targetLanguage }`, constructs a Gemini prompt, and returns the translated text. | `@google/generative-ai`, `process.env.GEMINI_API_KEY` |

### Supporting Libraries

- `lib/analysis.ts` – exposes `analyzeCaption` and the `CaptionAnalysisNotConfiguredError` used by `/api/analysis`.
- `lib/bedrock.ts` – handles AWS SDK setup and Bedrock invocation logic.
- `lib/supabase_admin.ts` – service-role Supabase client for privileged queries.
- `lib/supabase-browser.ts` – browser Supabase singleton used in client components.
- `lib/translation.ts` & `lib/translation-context.tsx` – client-side helpers that call `/api/translate`.

### Test Coverage

- `__tests__/app/api/analysis/route.test.ts` – exercises validation and Bedrock failure paths.
- `__tests__/app/api/posts/route.test.ts` – validates posting and fetching logic with mocked Supabase clients.
- `__tests__/app/api/posts/analyze/route.test.ts` – covers the analysis endpoint, ensuring Supabase and Bedrock interactions are exercised via mocks.
- `__tests__/app/api/community/create/route.test.ts` – verifies community creation, owner membership insertion, and cleanup when membership fails.
- `__tests__/app/api/community/post/route.test.ts` – checks community post validation, inferred content type logic, and Supabase error handling.
- `__tests__/app/api/collections/route.test.ts` – validates collection creation, required fields, and Supabase error propagation.

## Database Expectations (Supabase)

Referenced tables from the codebase and docs:

- `profiles` – User profile metadata keyed by `auth.users.id`.
- `student_posts` – Core feed content used by `/api/posts`.
- Future tables (per `docs/backend_diagram.md`): `community_posts`, `communities`, `community_members`, `postcard_collections`, `postcards`, `follows`.

Row Level Security policies will be required once these tables are built; server-side routes currently rely on the service key but should eventually follow the principle of least privilege.

## Deployment & Configuration Notes

- Redirect URLs for Supabase Auth must be set under **Authentication → URL Configuration** (local + production domains).
- AWS Bedrock credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `BEDROCK_MODEL_ID`) and Gemini API key must exist in the runtime environment for `/api/analysis`, `/api/bedrock`, and `/api/translate`.
- When deploying (Vercel, Netlify, etc.), export the same `.env.local` settings to the hosting platform.

---

Use this overview as the baseline when reorganizing or extending the API. Add route files under `app/api/<feature>/route.ts`, keep shared logic in `lib/`, and update this document as new endpoints or services come online.***
