"use client"

import { useTranslatedText } from '@/lib/use-translated-text'

interface TranslatedTextProps {
  text: string
  className?: string
  children?: React.ReactNode
}

export function TranslatedText({ text, className, children }: TranslatedTextProps) {
  const { translatedText, isLoading } = useTranslatedText(text)

  return (
    <span className={className}>
      {children || translatedText}
      {isLoading && (
        <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse ml-1" />
      )}
    </span>
  )
}
