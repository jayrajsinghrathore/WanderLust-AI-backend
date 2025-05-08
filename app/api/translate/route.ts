import { NextResponse } from "next/server"
import axios from "axios"

// LibreTranslate API endpoint (free and open source)
const LIBRETRANSLATE_API_URL = "https://libretranslate.com/translate"

export async function POST(request: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Call the LibreTranslate API
    const response = await axios.post(LIBRETRANSLATE_API_URL, {
      q: text,
      source: sourceLanguage || "auto",
      target: targetLanguage,
      format: "text",
    })

    return NextResponse.json({
      translatedText: response.data.translatedText,
      detectedSourceLanguage: sourceLanguage || "auto",
    })
  } catch (error) {
    console.error("Translation error:", error)

    // Fallback to a simple dictionary for common phrases if API fails
    const fallbackTranslations: Record<string, Record<string, string>> = {
      ja: {
        "Hello, how are you?": "こんにちは、お元気ですか？",
        "Where is the nearest train station?": "最寄りの駅はどこですか？",
        "I would like to order this, please.": "これを注文したいです。",
        "How much does this cost?": "これはいくらですか？",
        "Can you help me?": "手伝ってもらえますか？",
        "Thank you very much.": "どうもありがとうございます。",
      },
      es: {
        "Hello, how are you?": "Hola, ¿cómo estás?",
        "Where is the nearest train station?": "¿Dónde está la estación de tren más cercana?",
        "I would like to order this, please.": "Me gustaría ordenar esto, por favor.",
        "How much does this cost?": "¿Cuánto cuesta esto?",
        "Can you help me?": "¿Puede ayudarme?",
        "Thank you very much.": "Muchas gracias.",
      },
      fr: {
        "Hello, how are you?": "Bonjour, comment allez-vous?",
        "Where is the nearest train station?": "Où est la gare la plus proche?",
        "I would like to order this, please.": "Je voudrais commander ceci, s'il vous plaît.",
        "How much does this cost?": "Combien ça coûte?",
        "Can you help me?": "Pouvez-vous m'aider?",
        "Thank you very much.": "Merci beaucoup.",
      },
    }

    // Check if we have a fallback translation
    if (fallbackTranslations[targetLanguage] && fallbackTranslations[targetLanguage][text]) {
      return NextResponse.json({
        translatedText: fallbackTranslations[targetLanguage][text],
        detectedSourceLanguage: "en",
        note: "Using fallback translation",
      })
    }

    return NextResponse.json(
      {
        error: "Translation failed",
        translatedText: `[Translation unavailable for "${text}"]`,
      },
      { status: 200 },
    )
  }
}
