"use client"

import Image from "next/image"
import { useState } from "react"
import { Search, Send } from "lucide-react"
import { mockConversations, currentUser } from "@/lib/mock-data"
import { formatTimeAgo } from "@/lib/utils"
import type { Conversation } from "@/lib/types"

export function MessagingView() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState("")

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    console.log("[v0] Sending message:", messageInput)
    setMessageInput("")
  }

  if (selectedConversation) {
    const otherParticipant = selectedConversation.participants.find((p) => p.id !== currentUser.id)

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50">
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-lime-300 hover:text-lime-700 font-medium"
          >
            ← Back
          </button>
          <Image
            src={otherParticipant?.avatar || "/placeholder.svg"}
            alt={otherParticipant?.displayName || "Conversation participant"}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{otherParticipant?.displayName}</h3>
            <p className="text-sm text-gray-500">@{otherParticipant?.username}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-start">
            <div className="bg-purple-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
              <p className="text-gray-900">{selectedConversation.lastMessage.content}</p>
              <span className="text-xs text-gray-500 mt-1 block">
                {formatTimeAgo(selectedConversation.lastMessage.timestamp)}
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="gradient-purple rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
              <p className="text-white">That sounds great! I&apos;d love to join.</p>
              <span className="text-xs text-purple-200 mt-1 block">2h ago</span>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-purple-100 bg-white">
          <div className="flex items-center gap-2 bg-purple-50 rounded-full px-4 py-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Messages</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-2">
        {mockConversations.map((conversation) => {
          const otherParticipant = conversation.participants.find((p) => p.id !== currentUser.id)
          return (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl hover:bg-purple-50 transition-colors"
            >
              <div className="relative">
                <Image
                  src={otherParticipant?.avatar || "/placeholder.svg"}
                  alt={otherParticipant?.displayName || "Conversation participant"}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {conversation.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-lime-300 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{otherParticipant?.displayName}</h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(conversation.lastMessage.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.content}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
