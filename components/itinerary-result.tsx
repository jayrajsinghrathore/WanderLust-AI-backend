"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Sun, ArrowLeft, Share2, Printer, Edit, Heart, MapPin } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"
import axios from "axios"

interface ItineraryResultProps {
  itinerary: any
  onBack: () => void
}

export default function ItineraryResult({ itinerary, onBack }: ItineraryResultProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [currentDay, setCurrentDay] = useState(1)
  const [weather, setWeather] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(!!itinerary.tripId)

  // Fetch weather data if not already loaded
  const fetchWeather = async () => {
    if (weather.length > 0 || !itinerary.destination) return

    try {
      // Extract city name from destination (e.g., "Kyoto, Japan" -> "Kyoto")
      const city = itinerary.destination.split(",")[0].trim()

      const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
        params: {
          q: city,
          appid: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
          units: "metric",
          cnt: 5, // 5-day forecast
        },
      })

      // Process the weather data
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
      // Don't show an error toast to avoid disrupting the user experience
    }
  }

  // Call fetchWeather when component mounts
  React.useEffect(() => {
    fetchWeather()
  }, [itinerary.destination])

  const saveTrip = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save this itinerary",
        variant: "destructive",
      })
      return
    }

    if (isSaved) {
      // Already saved, no need to save again
      toast({
        title: "Already Saved",
        description: "This itinerary is already saved to your trips",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post("/api/trips", {
        itinerary,
      })

      if (response.data && response.data.tripId) {
        setIsSaved(true)
        itinerary.tripId = response.data.tripId

        toast({
          title: "Success",
          description: "Itinerary saved to your trips",
        })
      }
    } catch (error) {
      console.error("Failed to save trip:", error)
      toast({
        title: "Error",
        description: "Failed to save the itinerary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${itinerary.duration}-day Trip to ${itinerary.destination}`,
          text: `Check out my ${itinerary.duration}-day itinerary for ${itinerary.destination}!`,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err))
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Itinerary link copied to clipboard!",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Planner
        </Button>
        <h1 className="text-3xl font-bold">Your Personalized Itinerary</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    <span className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      {itinerary.destination}
                    </span>
                  </CardTitle>
                  <CardDescription>{itinerary.dates || `${itinerary.duration} days`}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={saveTrip} disabled={isLoading || isSaved}>
                    <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-primary" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/planner?edit=${itinerary.tripId}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{itinerary.summary}</p>

              <div className="flex overflow-x-auto pb-2 mb-6">
                {itinerary.days.map((day: any) => (
                  <Button
                    key={day.day}
                    variant={currentDay === day.day ? "default" : "outline"}
                    className="mr-2 whitespace-nowrap"
                    onClick={() => setCurrentDay(day.day)}
                  >
                    Day {day.day}: {day.title}
                  </Button>
                ))}
              </div>

              <div className="space-y-6">
                {itinerary.days
                  .filter((day: any) => day.day === currentDay)
                  .map((day: any) => (
                    <div key={day.day}>
                      <h3 className="text-xl font-semibold mb-4">
                        Day {day.day}: {day.title}
                      </h3>
                      <div className="space-y-6">
                        {day.activities.map((activity: any, index: number) => (
                          <div key={index} className="flex">
                            <div className="w-24 flex-shrink-0 text-sm text-muted-foreground">{activity.time}</div>
                            <div className="w-px bg-border mx-4 relative">
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary"></div>
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                  <h4 className="font-medium">{activity.title}</h4>
                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {activity.duration}
                                    <Badge variant="outline" className="ml-2">
                                      {activity.type}
                                    </Badge>
                                  </div>
                                </div>
                                {activity.image && (
                                  <div className="relative w-full md:w-32 h-24 rounded-md overflow-hidden">
                                    <Image
                                      src={activity.image || "/placeholder.svg"}
                                      alt={activity.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Destination</h4>
                <p className="text-muted-foreground">{itinerary.destination}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Duration</h4>
                <p className="text-muted-foreground">{itinerary.duration} days</p>
              </div>
              {itinerary.dates && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Dates</h4>
                  <p className="text-muted-foreground">{itinerary.dates}</p>
                </div>
              )}
              <Separator />
              {itinerary.accommodation && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Accommodation</h4>
                  <p className="text-muted-foreground">{itinerary.accommodation}</p>
                </div>
              )}
              {itinerary.transportation && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Transportation</h4>
                  <p className="text-muted-foreground">{itinerary.transportation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weather Forecast</CardTitle>
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
              <CardTitle>Useful Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Hello</p>
                  <p className="text-muted-foreground">Konnichiwa (こんにちは)</p>
                </div>
                <div>
                  <p className="font-medium">Thank you</p>
                  <p className="text-muted-foreground">Arigatou gozaimasu (ありがとうございます)</p>
                </div>
                <div>
                  <p className="font-medium">Excuse me</p>
                  <p className="text-muted-foreground">Sumimasen (すみません)</p>
                </div>
                <div>
                  <p className="font-medium">Where is...?</p>
                  <p className="text-muted-foreground">...wa doko desu ka? (〜はどこですか？)</p>
                </div>
                <div>
                  <p className="font-medium">How much is this?</p>
                  <p className="text-muted-foreground">Ikura desu ka? (いくらですか？)</p>
                </div>
              </div>
              <Button variant="link" className="px-0 mt-2">
                View more phrases →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
