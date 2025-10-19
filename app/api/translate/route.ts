import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json()
    
    console.log('Translation request:', { text, targetLanguage })
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY)

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      )
    }

    // Use Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `你是一名專業的翻譯員。你的任務是將給定的文字只翻譯一次成目標語言，使用最自然、最流暢的母語表達方式。不要包含多種翻譯選項、解釋或任何評論。
不要加上引號或前綴如「翻譯：」。
只返回純文字的翻譯結果
    Target language: ${targetLanguage}
    Text: ${text}`
    const result = await model.generateContent(prompt)
    const translatedText = result.response.text()

    if (!translatedText) {
      throw new Error('No translation returned from Gemini API')
    }

    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
