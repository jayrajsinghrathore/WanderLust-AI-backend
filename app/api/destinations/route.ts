import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const interests = searchParams.get("interests")
    const budget = searchParams.get("budget")
    const duration = searchParams.get("duration")

    // Create a prompt for Gemini based on user preferences
    let prompt =
      "Suggest 5 travel destinations with the following information for each: name, description, tags (3 categories), budget level ($ to $$$), and best time to visit."

    if (interests) {
      prompt += ` The traveler is interested in: ${interests}.`
    }

    if (budget) {
      prompt += ` Their budget is around: ${budget}.`
    }

    if (duration) {
      prompt += ` They plan to travel for: ${duration} days.`
    }

    prompt +=
      " Return the response as a JSON array with objects containing id, name, description, image (leave as null), tags (array), budget, and bestTime fields."

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    console.log("Gemini raw response:", text)
    // Parse the JSON response from Gemini
    let destinations = []
    try {
      destinations = JSON.parse(text)

      // Add placeholder images
      destinations = destinations.map((dest: any, index: number) => ({
        ...dest,
        image: `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(dest.name)}`,
      }))
    } catch (error) {
      console.error("Error parsing Gemini response:", error)
      return NextResponse.json({ error: "Failed to parse destinations data" }, { status: 500 })
    }

    return NextResponse.json({ destinations })
  } catch (error) {
    console.error("Error fetching destinations:", error)
    return NextResponse.json({ error: "Failed to fetch destinations" }, { status: 500 })
  }
}
