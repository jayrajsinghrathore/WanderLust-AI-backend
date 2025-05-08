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
    const tripId = searchParams.get("tripId")

    if (tripId) {
      // Get a specific trip
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
          userId: session.user.id,
        },
        include: {
          destinations: true,
          itinerary: {
            include: {
              activities: true,
            },
            orderBy: {
              day: "asc",
            },
          },
        },
      })

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 })
      }

      return NextResponse.json({ trip })
    } else {
      // Get all trips
      const trips = await prisma.trip.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          destinations: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json({ trips })
    }
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const data = await request.json()
    const { itinerary } = data

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary data is required" }, { status: 400 })
    }

    // Create a new trip with its itinerary
    const trip = await prisma.trip.create({
      data: {
        title: `Trip to ${itinerary.destination}`,
        description: itinerary.summary,
        userId: session.user.id,
        destinations: {
          create: [
            {
              name: itinerary.destination,
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

    return NextResponse.json({
      message: "Trip saved successfully",
      tripId: trip.id,
    })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const data = await request.json()
    const { tripId, updates } = data

    if (!tripId || !updates) {
      return NextResponse.json({ error: "Trip ID and updates are required" }, { status: 400 })
    }

    // Check if trip exists and belongs to the user
    const existingTrip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    })

    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found or access denied" }, { status: 404 })
    }

    // Update the trip
    const updatedTrip = await prisma.trip.update({
      where: {
        id: tripId,
      },
      data: {
        title: updates.title,
        description: updates.description,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      },
    })

    return NextResponse.json({
      message: "Trip updated successfully",
      trip: updatedTrip,
    })
  } catch (error) {
    console.error("Error updating trip:", error)
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get("tripId")

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 })
    }

    // Check if trip exists and belongs to the user
    const existingTrip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    })

    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found or access denied" }, { status: 404 })
    }

    // Delete the trip
    await prisma.trip.delete({
      where: {
        id: tripId,
      },
    })

    return NextResponse.json({
      message: "Trip deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting trip:", error)
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 })
  }
}
