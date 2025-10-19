export interface TranslationOptions {
  text: string
  targetLanguage: string
}

export interface TranslationResult {
  translatedText: string
  error?: string
}

export async function translateText(options: TranslationOptions): Promise<TranslationResult> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { translatedText: options.text, error: errorData.error }
    }

    const data = await response.json()
    return { translatedText: data.translatedText }
  } catch (error) {
    console.error('Translation service error:', error)
    return { 
      translatedText: options.text, 
      error: 'Translation service unavailable' 
    }
  }
}

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
  ar: 'العربية',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский',
  ko: '한국어'
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES
