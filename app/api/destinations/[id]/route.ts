import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Create a prompt for Gemini to generate a detailed description of the destination
    const prompt = `Generate a detailed travel description for a destination with ID ${id}. 
    Include name, description, rating, tags (array of 3-5 interests), budget level ($ to $$$), best time to visit,
    weather information for each season, and at least 4 popular attractions with names and descriptions.
    If the ID doesn't give you enough information, pick a popular travel destination.
    Format the result as a JSON object.`

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response from Gemini
    let destination
    try {
      destination = JSON.parse(text)

      // Add a placeholder image if none exists
      if (!destination.image) {
        destination.image = `/placeholder.svg?height=600&width=1200&text=${encodeURIComponent(destination.name)}`
      }

      // Add placeholder images for attractions if needed
      if (destination.attractions) {
        destination.attractions = destination.attractions.map((attr: any, index: number) => ({
          ...attr,
          image: attr.image || `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(attr.name)}`,
        }))
      }
    } catch (error) {
      console.error("Error parsing Gemini response:", error)
      return NextResponse.json({ error: "Failed to parse destination data" }, { status: 500 })
    }

    return NextResponse.json({ destination })
  } catch (error) {
    console.error("Error fetching destination:", error)
    return NextResponse.json({ error: "Failed to fetch destination" }, { status: 500 })
  }
}
