import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const destinationId = searchParams.get("destinationId")

    if (destinationId) {
      // Check if a specific place is saved
      const savedPlace = await prisma.savedPlace.findFirst({
        where: {
          userId: session.user.id,
          id: destinationId,
        },
      })

      return NextResponse.json({ isSaved: !!savedPlace })
    } else {
      // Get all saved places
      const savedPlaces = await prisma.savedPlace.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json({ savedPlaces })
    }
  } catch (error) {
    console.error("Error fetching saved places:", error)
    return NextResponse.json({ error: "Failed to fetch saved places" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const data = await request.json()
    const { action, place } = data

    if (action === "save") {
      // Save a new place
      const savedPlace = await prisma.savedPlace.create({
        data: {
          id: place.id,
          name: place.name,
          description: place.description,
          image: place.image,
          type: place.type,
          userId: session.user.id,
        },
      })

      return NextResponse.json({
        message: "Place saved successfully",
        savedPlace,
      })
    } else if (action === "delete") {
      // Delete a saved place
      await prisma.savedPlace.deleteMany({
        where: {
          id: place.id,
          userId: session.user.id,
        },
      })

      return NextResponse.json({
        message: "Place removed successfully",
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error managing saved place:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
