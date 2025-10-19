import { useState, useEffect } from 'react'
import { useTranslation } from './translation-context'

export function useTranslatedText(originalText: string, componentType?: string) {
  const { translate, currentLanguage } = useTranslation()
  const [translatedText, setTranslatedText] = useState(originalText)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentLanguage === 'en' || !originalText.trim()) {
      setTranslatedText(originalText)
      return
    }

    setIsLoading(true)
    translate(originalText, componentType)
      .then(setTranslatedText)
      .catch(() => setTranslatedText(originalText))
      .finally(() => setIsLoading(false))
  }, [originalText, currentLanguage, translate, componentType])

  return { translatedText, isLoading }
}
