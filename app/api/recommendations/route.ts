import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function GET(request: Request) {
  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const location = searchParams.get("location")
  const type = searchParams.get("type") || "all"
  const latitude = searchParams.get("latitude")
  const longitude = searchParams.get("longitude")

  if (!location && (!latitude || !longitude)) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 })
  }

  try {
    // Use Gemini to generate recommendations
    const results = await generateAIRecommendations(location || `${latitude},${longitude}`, type)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 })
  }
}

async function generateAIRecommendations(location: string, type: string) {
  // Create a prompt for Gemini AI to generate recommendations
  let prompt = `Recommend places for travelers in ${location}.`

  if (type === "restaurants") {
    prompt = `Recommend 5 great restaurants in ${location}. Include name, description, cuisine type, price level ($ to $$$), and at least one signature dish for each restaurant.`
  } else if (type === "attractions") {
    prompt = `Recommend 5 must-see attractions in ${location}. Include name, description, why it's special, entrance fee if applicable, and best time to visit.`
  } else if (type === "activities") {
    prompt = `Recommend 5 interesting activities to do in ${location}. Include activity name, description, approximate duration, price range, and level of physical exertion required.`
  } else {
    prompt = `Recommend places for travelers in ${location}. Provide 3 restaurants, 3 attractions, and 3 activities. For each place, include name, brief description, and any relevant details like price level or special features.`
  }

  prompt += ` Format the response as a JSON object with appropriate fields for each type of recommendation.`

  // Generate content with Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })
  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // Parse the JSON response from Gemini
  let recommendations
  try {
    recommendations = JSON.parse(text)

    // Add placeholder images
    if (type !== "all") {
      recommendations = recommendations.map((rec: any, index: number) => ({
        ...rec,
        id: index + 1,
        image: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(rec.name)}`,
        // Add coordinates for map display
        location: {
          lat: 0, // We don't have real coordinates without Google Maps API
          lng: 0,
        },
      }))
      return { [type]: recommendations }
    } else {
      // Process each category if "all" type
      for (const category of ["restaurants", "attractions", "activities"]) {
        if (recommendations[category]) {
          recommendations[category] = recommendations[category].map((rec: any, index: number) => ({
            ...rec,
            id: index + 1,
            image: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(rec.name)}`,
            // Add coordinates for map display
            location: {
              lat: 0, // We don't have real coordinates without Google Maps API
              lng: 0,
            },
          }))
        }
      }
    }
  } catch (error) {
    console.error("Error parsing Gemini response:", error)
    throw new Error("Failed to parse recommendations data")
  }

  return recommendations
}
