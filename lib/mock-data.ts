import type { User, Post, Message, Conversation } from "./types"

export const currentUser: User = {
  id: "1",
  username: "you",
  displayName: "You",
  avatar: "/diverse-user-avatars.png",
  bio: "Living my best life",
  location: "San Francisco, CA",
}

export const mockUsers: User[] = [
  {
    id: "2",
    username: "sarah_j",
    displayName: "Sarah Johnson",
    avatar: "/diverse-woman-smiling.png",
    bio: "Coffee lover and photographer",
    location: "San Francisco, CA",
    isInHomeCircle: true,
  },
  {
    id: "3",
    username: "mike_chen",
    displayName: "Mike Chen",
    avatar: "/casual-man.png",
    bio: "Tech enthusiast",
    location: "San Francisco, CA",
    isInHomeCircle: true,
  },
  {
    id: "4",
    username: "emma_w",
    displayName: "Emma Wilson",
    avatar: "/professional-woman.png",
    bio: "Designer & artist",
    location: "San Francisco, CA",
    isInHomeCircle: true,
  },
  {
    id: "5",
    username: "alex_local",
    displayName: "Alex Rivera",
    avatar: "/diverse-person-park.png",
    bio: "Local explorer",
    location: "San Francisco, CA",
    isInHomeCircle: false,
  },
  {
    id: "6",
    username: "jamie_sf",
    displayName: "Jamie Park",
    avatar: "/person-friendly.jpg",
    bio: "Food blogger",
    location: "San Francisco, CA",
    isInHomeCircle: false,
  },
]

export const mockPosts: Post[] = [
  {
    id: "1",
    type: "message-summary",
    author: mockUsers[0],
    content: "Miss u! 💜",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    likes: 0,
    comments: 0,
    messageCount: 8,
    participants: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
  },
  {
    id: "2",
    type: "user",
    author: mockUsers[0],
    content: "Beautiful sunset at the beach today! The colors were absolutely stunning.",
    image: "/sunset-beach-tranquil.png",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    likes: 24,
    comments: 5,
    isLiked: false,
  },
  {
    id: "3",
    type: "user",
    author: mockUsers[1],
    content: "Just finished my new art piece! What do you think?",
    image: "/abstract-composition.png",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    likes: 42,
    comments: 12,
    isLiked: true,
  },
  {
    id: "7",
    type: "message-summary",
    author: mockUsers[1],
    content: "Good luck on midterms! 📚✨",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    likes: 0,
    comments: 0,
    messageCount: 12,
    participants: [mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]],
  },
  {
    id: "4",
    type: "user",
    author: mockUsers[2],
    content: "Coffee and coding - perfect morning combo",
    image: "/coffee-laptop.jpg",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    likes: 18,
    comments: 3,
    isLiked: false,
  },
]

export const mockLocalPosts: Post[] = [
  {
    id: "5",
    type: "user",
    author: mockUsers[3],
    content: "Found this amazing hidden cafe in the Mission District!",
    image: "/cozy-cafe.png",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
    likes: 31,
    comments: 8,
    isLiked: false,
  },
  {
    id: "6",
    type: "user",
    author: mockUsers[4],
    content: "Street art tour this weekend - who wants to join?",
    image: "/vibrant-street-art.png",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    likes: 15,
    comments: 6,
    isLiked: false,
  },
]

export const mockMessages: Message[] = [
  {
    id: "1",
    conversationId: "1",
    sender: mockUsers[0],
    content: "Hey! Are you free this weekend?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
  },
  {
    id: "2",
    conversationId: "2",
    sender: mockUsers[1],
    content: "Thanks for the recommendation!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: true,
  },
]

export const mockConversations: Conversation[] = [
  {
    id: "1",
    participants: [currentUser, mockUsers[0]],
    lastMessage: mockMessages[0],
    unreadCount: 2,
  },
  {
    id: "2",
    participants: [currentUser, mockUsers[1]],
    lastMessage: mockMessages[1],
    unreadCount: 0,
  },
  {
    id: "3",
    participants: [currentUser, mockUsers[2]],
    lastMessage: {
      id: "3",
      conversationId: "3",
      sender: mockUsers[2],
      content: "See you tomorrow!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      isRead: true,
    },
    unreadCount: 0,
  },
]
