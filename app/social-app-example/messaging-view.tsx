"use client"

import { useState } from "react"
import { mockConversations, currentUser } from "./mock-data"
import { formatTimeAgo } from "./utils"
import type { Conversation } from "./types"

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
      <div className="flex flex-col h-full bg-white dark:bg-gray-800">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-purple-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30">
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            ← Back
          </button>
          <img
            src={otherParticipant?.avatar || "/assets_photos/placeholder.svg"}
            alt={otherParticipant?.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{otherParticipant?.displayName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{otherParticipant?.username}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-start">
            <div className="bg-purple-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
              <p className="text-gray-900 dark:text-gray-100">{selectedConversation.lastMessage.content}</p>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                {formatTimeAgo(selectedConversation.lastMessage.timestamp)}
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="gradient-purple rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
              <p className="text-white">That sounds great! I'd love to join.</p>
              <span className="text-xs text-purple-200 mt-1 block">2h ago</span>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-gray-700 rounded-full px-4 py-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              <span className="text-white">📤</span>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Messages</h1>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 rounded-2xl border border-purple-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <div className="relative">
                <img
                  src={otherParticipant?.avatar || "/assets_photos/placeholder.svg"}
                  alt={otherParticipant?.displayName}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {conversation.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{otherParticipant?.displayName}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(conversation.lastMessage.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{conversation.lastMessage.content}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
