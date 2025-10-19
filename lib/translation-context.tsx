"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { translateText, SupportedLanguage, SUPPORTED_LANGUAGES } from './translation'

interface TranslationContextType {
  currentLanguage: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  translate: (text: string, componentType?: string) => Promise<string>
  isTranslating: boolean
  supportedLanguages: typeof SUPPORTED_LANGUAGES
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en')
  const [isTranslating, setIsTranslating] = useState(false)

  const translate = useCallback(async (text: string, componentType?: string): Promise<string> => {
    if (currentLanguage === 'en' || !text.trim()) {
      return text
    }

    // Only translate for specific components - PREVENT API CALLS for others
    const allowedComponents = ['post-card', 'top-stories', 'top-locations']
    if (componentType && !allowedComponents.includes(componentType)) {
      console.log(`Translation blocked for component: ${componentType}`)
      return text
    }

    // Only translate substantial content
    if (text.length < 10 || text.includes('@') || text.includes('http')) {
      return text
    }

    // Only make API call for allowed components
    setIsTranslating(true)
    try {
      const result = await translateText({
        text,
        targetLanguage: currentLanguage
      })
      return result.translatedText
    } catch (error) {
      console.error('Translation failed:', error)
      return text
    } finally {
      setIsTranslating(false)
    }
  }, [currentLanguage])

  const setLanguage = useCallback((language: SupportedLanguage) => {
    setCurrentLanguage(language)
  }, [])

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        translate,
        isTranslating,
        supportedLanguages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
