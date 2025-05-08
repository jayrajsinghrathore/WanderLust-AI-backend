import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const data = await request.json()
    const { destination, duration, interests, travelStyle, budget, dates, activities, accommodation } = data

    // Create a prompt for Gemini AI to generate an itinerary
    let prompt = `Create a detailed travel itinerary for a ${duration}-day trip to ${destination}.`

    // Add user preferences to the prompt
    if (interests && interests.length > 0) {
      prompt += ` The traveler is interested in: ${interests.join(", ")}.`
    }

    if (travelStyle) {
      prompt += ` Their travel style is: ${travelStyle}.`
    }

    if (budget) {
      prompt += ` Their budget level is: ${budget}.`
    }

    if (activities && activities.length > 0) {
      prompt += ` They want to include these activities: ${activities.join(", ")}.`
    }

    if (accommodation) {
      prompt += ` They prefer staying in: ${accommodation}.`
    }

    prompt += ` The itinerary should include a daily schedule with morning, afternoon, and evening activities, recommended places to eat, and transportation tips.`

    prompt += ` Format the response as a JSON object with the following structure: {
      "destination": string,
      "duration": number,
      "summary": string,
      "days": [
        {
          "day": number,
          "title": string,
          "activities": [
            {
              "time": string,
              "title": string,
              "description": string,
              "type": string (one of: food, attraction, activity, transport),
              "duration": string
            }
          ]
        }
      ]
    }`

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response from Gemini
    let itinerary
    try {
      itinerary = JSON.parse(text)
    } catch (error) {
      console.error("Error parsing Gemini response:", error)
      return NextResponse.json({ error: "Failed to parse itinerary data" }, { status: 500 })
    }

    // Save the itinerary to the database if requested
    if (data.saveTrip) {
      const trip = await prisma.trip.create({
        data: {
          title: `Trip to ${destination}`,
          description: itinerary.summary,
          startDate: dates?.startDate ? new Date(dates.startDate) : undefined,
          endDate: dates?.endDate ? new Date(dates.endDate) : undefined,
          userId: session.user.id,
          destinations: {
            create: [
              {
                name: destination,
                description: itinerary.summary,
              },
            ],
          },
          itinerary: {
            create: itinerary.days.map((day: any) => ({
              day: day.day,
              title: day.title,
              activities: {
                create: day.activities.map((activity: any) => ({
                  title: activity.title,
                  description: activity.description,
                  time: activity.time,
                  duration: activity.duration,
                  type: activity.type,
                })),
              },
            })),
          },
        },
      })

      itinerary.tripId = trip.id
    }

    return NextResponse.json({ itinerary })
  } catch (error) {
    console.error("Error generating itinerary:", error)
    return NextResponse.json({ error: "Failed to generate itinerary" }, { status: 500 })
  }
}
