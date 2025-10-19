"use client"

import { useTranslatedText } from '@/lib/use-translated-text'
import { useTranslation } from '@/lib/translation-context'

interface PostTranslationProps {
  text: string
  className?: string
  showIndicator?: boolean
  componentType?: string
}

export function PostTranslation({ text, className, showIndicator = true, componentType }: PostTranslationProps) {
  const { currentLanguage } = useTranslation()
  const { translatedText, isLoading } = useTranslatedText(text, componentType)

  // Only show translation indicator if not English and text is substantial
  const shouldShowIndicator = showIndicator && currentLanguage !== 'en' && text.length > 10

  return (
    <span className={className}>
      {translatedText}
      {shouldShowIndicator && isLoading && (
        <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse ml-1" />
      )}
      {shouldShowIndicator && !isLoading && (
        <span className="inline-block w-2 h-2 bg-purple-500 rounded-full ml-1" title="Translated" />
      )}
    </span>
  )
}
