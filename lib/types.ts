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
