"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, Map, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<any[]>([])
  const [savedPlaces, setSavedPlaces] = useState<any[]>([])

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/auth/signin?callbackUrl=/profile")
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData()
    }
  }, [status])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Fetch user's trips
      const tripsResponse = await axios.get("/api/trips")
      setTrips(tripsResponse.data.trips || [])

      // Fetch user's saved places
      const placesResponse = await axios.get("/api/user/saved-places")
      setSavedPlaces(placesResponse.data.savedPlaces || [])
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load your profile data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSavedPlace = async (placeId: string) => {
    try {
      await axios.post("/api/user/saved-places", {
        action: "delete",
        place: { id: placeId },
      })

      // Remove the place from the local state
      setSavedPlaces(savedPlaces.filter((place) => place.id !== placeId))

      toast({
        title: "Success",
        description: "Place removed from your saved places",
      })
    } catch (error) {
      console.error("Error removing saved place:", error)
      toast({
        title: "Error",
        description: "Failed to remove the saved place. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-muted-foreground">Welcome back, {session?.user?.name || "Traveler"}</p>
          </div>
          <Button asChild>
            <Link href="/planner">Plan a New Trip</Link>
          </Button>
        </div>

        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="trips">Your Trips</TabsTrigger>
            <TabsTrigger value="saved">Saved Places</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="trips">
            <div className="grid gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Your Planned Trips</h2>
              </div>

              {trips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trips.map((trip) => (
                    <Link href={`/trips/${trip.id}`} key={trip.id}>
                      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative h-40">
                          <Image
                            src={
                              trip.destinations[0]?.image ||
                              `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(trip.title)}`
                            }
                            alt={trip.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{trip.title}</CardTitle>
                          <CardDescription className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {trip.startDate ? (
                              <>
                                {new Date(trip.startDate).toLocaleDateString()} -{" "}
                                {new Date(trip.endDate).toLocaleDateString()}
                              </>
                            ) : (
                              "No dates set"
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {trip.description || `A trip to ${trip.destinations[0]?.name || "a fantastic destination"}`}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Map className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No trips yet</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      You haven't planned any trips yet. Start planning your adventure!
                    </p>
                    <Button asChild>
                      <Link href="/planner">Plan Your First Trip</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Your Saved Places</h2>
              </div>

              {savedPlaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedPlaces.map((place) => (
                    <Card key={place.id} className="h-full overflow-hidden">
                      <div className="relative h-40">
                        <Image
                          src={
                            place.image ||
                            `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(place.name)}`
                          }
                          alt={place.name}
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                          onClick={(e) => {
                            e.preventDefault()
                            handleRemoveSavedPlace(place.id)
                          }}
                        >
                          <Heart className="h-4 w-4 fill-primary" />
                        </Button>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{place.name}</CardTitle>
                        <CardDescription>{place.type === "destination" ? "Destination" : place.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {place.description || `A wonderful place to explore`}
                        </p>
                        <div className="mt-4">
                          <Button variant="outline" className="w-full" asChild>
                            <Link href={`/planner?destination=${place.name}`}>Plan a Trip</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No saved places</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      You haven't saved any destinations yet. Explore destinations and save your favorites!
                    </p>
                    <Button asChild>
                      <Link href="/destinations">Explore Destinations</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <h3 className="font-medium">Email</h3>
                  <p className="text-muted-foreground">{session?.user?.email}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium">Name</h3>
                  <p className="text-muted-foreground">{session?.user?.name}</p>
                </div>

                {/* Other settings options would go here */}
                <div className="pt-4">
                  <Button variant="outline">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
