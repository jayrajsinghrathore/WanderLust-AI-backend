"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Star, Sun, Umbrella, DollarSign, Heart, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

export default function DestinationDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [destination, setDestination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<any[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [savingPlace, setSavingPlace] = useState(false)

  useEffect(() => {
    // Fetch destination data
    const fetchDestination = async () => {
      try {
        const response = await axios.get(`/api/destinations/${params.id}`)
        setDestination(response.data.destination)

        // Once we have the destination, fetch weather data
        if (response.data.destination.name) {
          fetchWeatherData(response.data.destination.name.split(",")[0].trim())
        }

        // Check if this destination is saved by the user
        if (session?.user) {
          checkIfSaved(response.data.destination.id)
        }
      } catch (error) {
        console.error("Error fetching destination:", error)
        toast({
          title: "Error",
          description: "Failed to load destination data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDestination()
  }, [params.id, session])

  const fetchWeatherData = async (city: string) => {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
        params: {
          q: city,
          appid: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
          units: "metric",
          cnt: 5, // 5-day forecast
        },
      })

      // Process weather data
      if (response.data && response.data.list) {
        const forecastData = response.data.list.map((item: any) => ({
          date: new Date(item.dt * 1000),
          day: new Date(item.dt * 1000).toLocaleString("en-US", { weekday: "short" }),
          temp: Math.round(item.main.temp),
          minTemp: Math.round(item.main.temp_min),
          weather: item.weather[0].main,
          icon: item.weather[0].icon,
        }))

        setWeather(forecastData)
      }
    } catch (error) {
      console.error("Failed to fetch weather data:", error)
      // Don't show error toast for weather specifically
    }
  }

  const checkIfSaved = async (destinationId: string) => {
    try {
      const response = await axios.get(`/api/user/saved-places?destinationId=${destinationId}`)
      setIsSaved(response.data.isSaved)
    } catch (error) {
      console.error("Error checking saved status:", error)
    }
  }

  const handleSavePlace = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save this destination",
        variant: "destructive",
      })
      return
    }

    setSavingPlace(true)

    try {
      const action = isSaved ? "delete" : "save"
      const response = await axios.post("/api/user/saved-places", {
        action,
        place: {
          id: destination.id,
          name: destination.name,
          description: destination.description,
          image: destination.image,
          type: "destination",
        },
      })

      setIsSaved(!isSaved)

      toast({
        title: isSaved ? "Removed from Wishlist" : "Added to Wishlist",
        description: isSaved
          ? "Destination has been removed from your saved places"
          : "Destination has been added to your wishlist",
      })
    } catch (error) {
      console.error("Error saving place:", error)
      toast({
        title: "Error",
        description: `Failed to ${isSaved ? "remove" : "save"} destination. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setSavingPlace(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!destination) {
    return (
      <div className="container py-20">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Destination Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The destination you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/destinations">Browse Destinations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden mb-8">
        <Image
          src={destination.image || "/placeholder.svg"}
          alt={destination.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <div className="flex items-center mb-2">
            <MapPin className="h-5 w-5 text-primary mr-2" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">{destination.name}</h1>
          </div>
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-4">
              <Star className="h-4 w-4 text-yellow-400 mr-1 fill-yellow-400" />
              <span className="text-white">{destination.rating || "4.8"}</span>
            </div>
            <div className="flex items-center mr-4">
              <Calendar className="h-4 w-4 text-primary mr-1" />
              <span className="text-white text-sm">{destination.bestTime || "Best time to visit"}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-primary mr-1" />
              <span className="text-white text-sm">{destination.budget || "$$$"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {destination.tags &&
              destination.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-white/20 hover:bg-white/30">
                  {tag}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attractions">Attractions</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">About {destination.name}</h2>
                <p className="text-muted-foreground leading-relaxed">{destination.description}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Best Time to Visit</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Sun className="h-4 w-4 mr-2 text-primary" />
                        Spring
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {destination.weather?.spring || "Mild and pleasant temperatures"}
                      </CardDescription>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Sun className="h-4 w-4 mr-2 text-primary" />
                        Summer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{destination.weather?.summer || "Warm and sunny days"}</CardDescription>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Sun className="h-4 w-4 mr-2 text-primary" />
                        Fall
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {destination.weather?.fall || "Mild temperatures with beautiful colors"}
                      </CardDescription>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Umbrella className="h-4 w-4 mr-2 text-primary" />
                        Winter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {destination.weather?.winter || "Cold temperatures with occasional precipitation"}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attractions" className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Top Attractions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(destination.attractions || []).map((attraction: any, index: number) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={attraction.image || "/placeholder.svg?height=300&width=400"}
                        alt={attraction.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>{attraction.name}</CardTitle>
                      <CardDescription>{attraction.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="weather" className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Weather Information</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {destination.name} has{" "}
                  {destination.weather ? "four distinct seasons" : "varied weather throughout the year"}, each offering
                  a unique experience for visitors.
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Seasonal Weather</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Spring (March to May)</h4>
                          <p className="text-muted-foreground">
                            {destination.weather?.spring || "Mild temperatures with blooming flowers"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Average temperature: 10-20°C (50-68°F)</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Summer (June to August)</h4>
                          <p className="text-muted-foreground">
                            {destination.weather?.summer || "Warm and sunny conditions"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Average temperature: 25-35°C (77-95°F)</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Fall (September to November)</h4>
                          <p className="text-muted-foreground">
                            {destination.weather?.fall || "Mild temperatures with colorful foliage"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Average temperature: 15-25°C (59-77°F)</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Winter (December to February)</h4>
                          <p className="text-muted-foreground">
                            {destination.weather?.winter || "Cold temperatures with possible snow"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Average temperature: 0-10°C (32-50°F)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Traveler Reviews</h2>
              <div className="space-y-4">
                {(destination.reviews || Array.from({ length: 3 })).map((review: any, i: number) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {review?.title || ["Amazing experience", "Beautiful destination", "Unforgettable trip"][i]}
                          </CardTitle>
                          <CardDescription>
                            {review?.author || ["John D.", "Sarah M.", "David L."][i]} -{" "}
                            {review?.date || ["May 2023", "October 2023", "March 2024"][i]}
                          </CardDescription>
                        </div>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={`h-4 w-4 ${j < (review?.rating || 5 - i * 0.5) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {review?.content ||
                          [
                            `${destination.name} exceeded all my expectations. The scenery was breathtaking and the local culture was fascinating. I spent a week exploring and still didn't see everything. The food was incredible too!`,
                            `We visited during the perfect season and it was magical. The city does get crowded in peak tourist season but it's worth it. Make sure to explore the less touristy areas for a more authentic experience.`,
                            `${destination.name} offers the perfect blend of adventure and relaxation. The locals were friendly and helpful. I recommend spending at least 5 days to fully experience everything this place has to offer.`,
                          ][i]}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" className="w-full">
                  Load More Reviews
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Your Trip</CardTitle>
              <CardDescription>Create a personalized itinerary for {destination.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild>
                <Link href={`/planner?destination=${destination.name}`}>Create Itinerary</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSavePlace} disabled={savingPlace}>
                <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-primary" : ""}`} />
                {savingPlace ? "Processing..." : isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weather Forecast</CardTitle>
              <CardDescription>Current 5-day forecast for {destination.name.split(",")[0]}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weather.length > 0
                  ? weather.map((day, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 text-sm text-muted-foreground">{day.day}</div>
                          <img
                            src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                            alt={day.weather}
                            className="h-8 w-8"
                          />
                          <span>{day.weather}</span>
                        </div>
                        <div>
                          <span className="font-medium">{day.temp}°C</span>
                          <span className="text-muted-foreground text-sm ml-2">{day.minTemp}°C</span>
                        </div>
                      </div>
                    ))
                  : Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 text-sm text-muted-foreground">
                            {["Mon", "Tue", "Wed", "Thu", "Fri"][i]}
                          </div>
                          <Sun className="h-5 w-5 text-yellow-500 mr-2" />
                          <span>{["Sunny", "Partly Cloudy", "Sunny", "Rainy", "Sunny"][i]}</span>
                        </div>
                        <div>
                          <span className="font-medium">{[24, 22, 25, 20, 23][i]}°C</span>
                          <span className="text-muted-foreground text-sm ml-2">{[15, 14, 16, 13, 15][i]}°C</span>
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nearby Destinations</CardTitle>
              <CardDescription>Other places to explore</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be dynamically populated based on the current destination */}
                {["Paris", "Barcelona", "Amsterdam"].map((city, i) => (
                  <Link href={`/destinations/${Number.parseInt(params.id) + i + 1}`} key={i}>
                    <div className="flex items-center space-x-4 hover:bg-muted p-2 rounded-md transition-colors">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden">
                        <Image
                          src={`/placeholder.svg?height=100&width=100&text=${city}`}
                          alt={city}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{city}</h4>
                        <p className="text-sm text-muted-foreground">
                          {["2 hours by train", "1.5 hours by plane", "3 hours by train"][i]}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
