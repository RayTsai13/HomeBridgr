export type User = {
  id: string
  username: string
  displayName: string
  avatar: string
  bio: string
  hometown: string
  location: string
  isInHomeCircle?: boolean
}

export type PostType = "user" | "message-summary"

export type Post = {
  id: string
  type: PostType
  author: User
  content: string
  image?: string
  location: string
  timestamp: Date
  likes: number
  comments: number
  isLiked?: boolean
  analysisTerms?: { term: string; explanation: string }[]
  analysisGeneratedAt?: Date
  analysisRawText?: string
  // For message-summary posts
  messageCount?: number
  participants?: User[]
  links?: { url: string; title: string }[]
  images?: string[]
}

export type Message = {
  id: string
  conversationId: string
  sender: User
  content: string
  timestamp: Date
  isRead: boolean
}

export type Conversation = {
  id: string
  participants: User[]
  lastMessage: Message
  unreadCount: number
}

export type SessionUser = {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}

export type Collection = {
  id: string
  name: string
  description?: string | null
  visibility?: string | null
  createdAt: Date
  // Optional postcard details
  fingerprint?: string | null
  source?: string | null
  postIds?: string[]
  items?: Array<{
    postId: string
    imageUrl: string | null
    caption: string | null
    authorId: string | null
    authorName: string | null
  }>
}
