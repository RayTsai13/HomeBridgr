import type { User, Post, Message, Conversation } from "./types"

const createDemoAnalysis = (
  terms: Array<{ term: string; explanation: string }>,
  generatedAt: string
) => {
  const normalised = terms.map((t) => ({ ...t }))
  return {
    analysisTerms: normalised,
    analysisGeneratedAt: new Date(generatedAt),
    analysisRawText: JSON.stringify({ terms: normalised }),
  }
}

export const currentUser: User = {
  id: "1",
  username: "test_user",
  displayName: "Wei Chen",
  avatar: "/raymond.jpg",
  bio: "UW Freshman",
  hometown: "Taoyuan, Taiwan",
  location: "Seattle, WA",
}

export const mockUsers: User[] = [
  {
    id: "2",
    username: "mom",
    displayName: "Mom",
    avatar: "/mom.jpg",
    bio: "Your loving mom ❤️",
    hometown: "Taipei, Taiwan",
    location: "Taoyuan, Taiwan",
    isInHomeCircle: true,
  },
  {
    id: "3",
    username: "dad",
    displayName: "Dad",
    avatar: "/dad.jpg",
    bio: "Your proud dad",
    hometown: "Kaohsiung, Taiwan",
    location: "Taoyuan, Taiwan",
    isInHomeCircle: true,
  },
  {
    id: "4",
    username: "sarah_j",
    displayName: "Cousin Sarah",
    avatar: "/diverse-woman-smiling.png",
    bio: "Coffee lover and photographer",
    hometown: "Los Angeles, CA",
    location: "Seattle, WA",
    isInHomeCircle: true,
  },
  {
    id: "5",
    username: "emma_w",
    displayName: "Emma Wilson",
    avatar: "/person-friendly.jpg",
    bio: "Designer & artist",
    hometown: "Barcelona, Spain",
    location: "Seattle, WA",
    isInHomeCircle: true,
  },
  {
    id: "5",
    username: "electric_eel",
    displayName: "Becca Caulton",
    avatar: "/becca-caulton.jpg",
    bio: "Electrical Computer Engineer!",
    hometown: "Boston, MA",
    location: "Seattle, WA",
    isInHomeCircle: false,
  },
  {
    id: "6",
    username: "Relateable_RA",
    displayName: "Jonathan Chu",
    avatar: "/jonathan.jpg",
    bio: "Computer Science Wiz",
    hometown: "Lynnwood, WA",
    location: "UWB",
    isInHomeCircle: false,
  },
]

export const mockPosts: Post[] = [
  {
    id: "1",
    type: "message-summary",
    author: mockUsers[0],
    content: "Miss u! 💜",
    location: "San Francisco, CA",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    likes: 0,
    comments: 0,
    messageCount: 8,
    participants: [mockUsers[0]],
    links: [
      { url: "https://www.consumerreports.org/health/food-safety/really-risky-foods-right-now-a7840705850/", title: "really risky foods right now" },
      { url: "https://www.amazon.com/live/video/07b962c9983144b79563cc5c113d5ea3?ref_=dp_ib_6_ivx_share", title: "What's the key to getting and staying organized? | Amazon Live" },
    ],
    images: ["/mom_postcard.jpg", "/baking_postcard.jpg", "/dog_postcard.jpg", "/dog2_postcard.jpg"],
  },
  {
    id: "2",
    type: "user",
    author: mockUsers[1],
    content: "Beautiful sunset at alki beach today! The aurora borealis was absolutely stunning.",
    image: "/sunset-beach-tranquil.png",
    location: "Ocean Beach, SF",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    likes: 24,
    comments: 5,
    isLiked: false,
    ...createDemoAnalysis(
      [
        {
          term: "Aurora borealis",
          explanation:
            "Natural light display caused by solar particles; seeing it this far south is rare and exciting.",
        },
        {
          term: "Alki Beach",
          explanation:
            "Popular waterfront spot in West Seattle known for skyline views—it sets the scene for the photo.",
        },
        {
          term: "Stunning",
          explanation:
            "Used here to emphasise how captivating the colours were in person.",
        },
      ],
      "2024-10-20T03:15:00.000Z"
    ),
  },
  {
    id: "3",
    type: "user",
    author: mockUsers[2],
    content: "Just finished my new art piece! I modelled it after Michaelangelo. What do you think?",
    image: "/abstract-composition.png",
    location: "Mission District, SF",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    likes: 42,
    comments: 12,
    isLiked: true,
    ...createDemoAnalysis(
      [
        {
          term: "Modelled",
          explanation:
            "Artist slang for taking inspiration; the spelling hints at a UK influence but here just means 'inspired by'.",
        },
        {
          term: "Michaelangelo",
          explanation:
            "Refers to Renaissance master Michelangelo; the playful misspelling shows excitement more than precision.",
        },
        {
          term: "Art piece",
          explanation:
            "Casual shorthand for artwork; signals this is a personal, possibly mixed-media project.",
        },
      ],
      "2024-10-19T22:05:00.000Z"
    ),
  },
  {
    id: "7",
    type: "message-summary",
    author: mockUsers[1],
    content: "Good luck on midterms! 📚✨",
    location: "San Francisco, CA",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    likes: 0,
    comments: 0,
    messageCount: 12,
    participants: [mockUsers[1]],
    links: [
      { url: "https://example.com/study-guide", title: "Study Guide" },
      { url: "https://example.com/notes", title: "Shared Notes" },
    ],
    images: ["/coffee-laptop.jpg", "/abstract-composition.png", "/diverse-person-park.png", "/casual-man.png"],
  },
  {
    id: "4",
    type: "user",
    author: mockUsers[3],
    content: "Coffee and coding - perfect morning combo",
    image: "/coffee-laptop.jpg",
    location: "Blue Bottle Coffee, SF",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    likes: 18,
    comments: 3,
    isLiked: false,
    ...createDemoAnalysis(
      [
        {
          term: "Coffee and coding",
          explanation:
            "Common phrase among developers meaning they are working from a café with caffeine as fuel.",
        },
        {
          term: "Blue Bottle Coffee",
          explanation:
            "Specialty café chain originating in Oakland; name signals a trendy, quiet workspace vibe.",
        },
        {
          term: "Morning combo",
          explanation:
            "Slang for a go-to routine that kicks off the day—in this case, caffeine plus laptop time.",
        },
      ],
      "2024-10-19T16:45:00.000Z"
    ),
  },
]

export const mockLocalPosts: Post[] = [
  {
    id: "5",
    type: "user",
    author: mockUsers[4],
    content: "Anyone down to carpool to Snoqualmie Falls this weekend? I live in UDistrict and can drive!",
    image: "/snoqualmie_falls.jpg",
    location: "Snoqualmie Falls, WA",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
    likes: 31,
    comments: 8,
    isLiked: false,
    ...createDemoAnalysis(
      [
        {
          term: "Down to",
          explanation:
            "Casual invite meaning 'interested in' or 'willing to join'; common West Coast slang.",
        },
        {
          term: "Carpool",
          explanation:
            "Sharing a ride to split costs; here it implies coordinating with other students.",
        },
        {
          term: "UDistrict",
          explanation:
            "Seattle shorthand for the University District, signalling the poster is near UW campus.",
        },
      ],
      "2024-10-20T04:30:00.000Z"
    ),
  },
  {
    id: "6",
    type: "user",
    author: mockUsers[5],
    content: "Did a super fun hike this weekend and it's not too far from Seattle!",
    image: "/pacific_crest.jpg",
    location: "Pacific Crest Trail, WA",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    likes: 15,
    comments: 6,
    isLiked: false,
    ...createDemoAnalysis(
      [
        {
          term: "Super fun",
          explanation:
            "Casual emphasis showing enthusiasm; signals the hike was especially enjoyable.",
        },
        {
          term: "This weekend",
          explanation:
            "Means 'recently'—usually the Saturday or Sunday that just passed.",
        },
        {
          term: "Not too far from Seattle",
          explanation:
            "Reassures friends the trail is within easy driving distance, encouraging them to join next time.",
        },
      ],
      "2024-10-20T01:10:00.000Z"
    ),
  },
]

export const mockMessages: Message[] = [
  {
    id: "1",
    conversationId: "1",
    sender: mockUsers[0],
    content: "Miss you sweetie! Call me when you can ❤️",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
  },
  {
    id: "2",
    conversationId: "2",
    sender: mockUsers[1],
    content: "Good luck on your exams! We're proud of you!",
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
