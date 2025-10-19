HomeBridgr App Router
├─ app/layout.tsx - wraps <TranslationProvider>, loads global styles, injects Vercel Analytics
├─ app/page.tsx - client redirect that checks Supabase session and pushes /home or /login
├─ app/login/page.tsx - Supabase Auth UI (email/magic-link) themed via ThemeSupa
└─ app/home/page.tsx - authenticated shell with top nav, bottom nav, and view state
   ├─ Home view
   │  ├─ <HomeFeed refreshToken userType="community">
   │  │  ├─ fetchPosts()/createPost from lib/api/posts.ts hitting `/api/posts?userType=community&viewerId=<session>`
   │  │  ├─ Auto-fallback to lib/mock-data.mockPosts when community feed is empty/offline
   │  │  └─ <PostCard>
   │  │     ├─ <PostTranslation> -> useTranslatedText -> /api/translate
   │  │     ├─ analyzePost() -> /api/posts/analyze -> <CaptionWithInsights>
   │  │     └─ Heart/Comment actions handled locally
   │  ├─ <SuggestedFriendsSidebar> (mockUsers)
   │  └─ <TopStoriesSidebar> (mock stories + PostTranslation)
   ├─ Student view
   │  └─ <HomeFeed refreshToken userType="student">
   │     ├─ fetchPosts() -> `/api/posts?userType=student&viewerId=<session>`
   │     └─ No mock fallback; shows empty state when no student posts exist
   ├─ Discover view - <DiscoverFeed> (mockLocalPosts) + <TopLocationsSidebar>
   ├─ Messages view - <MessagingView> (mockConversations + formatTimeAgo)
   ├─ Profile view - <ProfileView> displaying SessionUser metadata
   └─ Post composer modal - <PostComposer>
      ├─ Uploads images via createSupabaseBrowserClient to student_uploads bucket
      └─ Persists posts through createPost() -> /api/posts

Shared utilities and providers
├─ lib/translation-context.tsx + lib/use-translated-text.ts - gate translation calls and spinner state
├─ lib/api/collections.ts & lib/api/posts.ts - client helpers for JSON APIs
├─ lib/mock-data.ts - seed content for feeds, discover, messaging
├─ hooks/use-mobile.ts & hooks/use-toast.ts - layout/device behaviours
└─ components/ui/* - shadcn-derived primitives consumed across pages
