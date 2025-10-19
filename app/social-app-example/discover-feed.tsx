"use client"

import { useState } from "react"

// Reusable DiscoverCard component
interface DiscoverCardProps {
  title: string
  bgGradient: string
  accentColor: string
  imagePlaceholder: string
}

function DiscoverCard({ title, bgGradient, accentColor, imagePlaceholder }: DiscoverCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <article 
      className={`
        relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl 
        transition-all duration-300 cursor-pointer
        ${isHovered ? 'scale-105' : 'scale-100'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image placeholder with gradient background */}
      <div className={`${bgGradient} aspect-video relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/80 text-6xl font-bold opacity-50">
            {imagePlaceholder}
          </div>
        </div>
      </div>
      
      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className={`text-3xl font-bold text-white drop-shadow-lg ${accentColor}`}>
          {title}
        </h2>
      </div>
    </article>
  )
}

export function DiscoverFeed() {
  // Card configurations with postmodern color schemes
  const cardConfigs = [
    {
      title: "From: Mom",
      bgGradient: "bg-gradient-to-br from-pink-400 via-rose-500 to-orange-400",
      accentColor: "text-pink-100",
      imagePlaceholder: "💕"
    },
    {
      title: "From: Dad", 
      bgGradient: "bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700",
      accentColor: "text-cyan-100",
      imagePlaceholder: "👨"
    },
    {
      title: "From: Sara",
      bgGradient: "bg-gradient-to-br from-yellow-400 via-purple-500 to-pink-500",
      accentColor: "text-yellow-100", 
      imagePlaceholder: "👥"
    }
  ]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Discover</h1>
        <p className="text-gray-600 dark:text-gray-300">Messages from your extended circle</p>
      </div>
      
      <section className="space-y-8">
        {cardConfigs.map((card, index) => (
          <DiscoverCard
            key={index}
            title={card.title}
            bgGradient={card.bgGradient}
            accentColor={card.accentColor}
            imagePlaceholder={card.imagePlaceholder}
          />
        ))}
      </section>
    </main>
  )
}
