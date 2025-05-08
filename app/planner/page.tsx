"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import ItineraryResult from "@/components/itinerary-result"
import axios from "axios"

export default function PlannerPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [itineraryResult, setItineraryResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    destination: "",
    duration: "7",
    idealDestination: "",
    travelStyle: "balanced",
    budget: "mid",
    budgetAmount: [150],
    interests: [] as string[],
    accommodation: [] as string[],
    transportation: [] as string[],
    dietary: [] as string[],
    specialRequests: "",
  })

  const handleDurationChange = (value: string) => {
    setFormData({ ...formData, duration: value })

    // If start date is set, update end date based on new duration
    if (startDate) {
      setEndDate(addDays(startDate, Number.parseInt(value)))
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)

    // If duration is set, update end date
    if (date && formData.duration) {
      setEndDate(addDays(date, Number.parseInt(formData.duration)))
    }
  }

  const handleCheckboxChange = (field: string, value: string) => {
    setFormData((prev) => {
      const currentValues = [...prev[field as keyof typeof prev]] as string[]

      if (currentValues.includes(value)) {
        return {
          ...prev,
          [field]: currentValues.filter((v) => v !== value),
        }
      } else {
        return {
          ...prev,
          [field]: [...currentValues, value],
        }
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.destination && !formData.idealDestination) {
      toast({
        title: "Destination Required",
        description: "Please enter a destination or describe your ideal destination.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const requestData = {
        destination: formData.destination || formData.idealDestination,
        duration: Number.parseInt(formData.duration),
        interests: formData.interests,
        travelStyle: formData.travelStyle,
        budget: formData.budget,
        budgetAmount: formData.budgetAmount[0],
        accommodation: formData.accommodation,
        transportation: formData.transportation,
        dietary: formData.dietary,
        specialRequests: formData.specialRequests,
        dates: startDate
          ? {
              startDate: startDate.toISOString(),
              endDate: endDate?.toISOString(),
            }
          : undefined,
        saveTrip: !!session, // Save trip if user is logged in
      }

      const response = await axios.post("/api/itinerary", requestData)

      if (response.data && response.data.itinerary) {
        setItineraryResult(response.data.itinerary)
        setShowResult(true)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Error generating itinerary:", error)
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (showResult && itineraryResult) {
    return <ItineraryResult itinerary={itineraryResult} onBack={() => setShowResult(false)} />
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Plan Your Perfect Trip</h1>
          <p className="text-muted-foreground">
            Tell us about your travel preferences and we'll create a personalized itinerary for you
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="destination" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="destination" id="destination-tab">
                Destination
              </TabsTrigger>
              <TabsTrigger value="preferences" id="preferences-tab">
                Preferences
              </TabsTrigger>
              <TabsTrigger value="details" id="details-tab">
                Trip Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="destination" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Where do you want to go?</CardTitle>
                  <CardDescription>
                    Enter your destination or let us suggest places based on your interests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      name="destination"
                      placeholder="e.g., Tokyo, Japan"
                      value={formData.destination}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idealDestination">Or describe your ideal destination</Label>
                    <Textarea
                      id="idealDestination"
                      name="idealDestination"
                      placeholder="e.g., I'm looking for a beach destination with cultural experiences and good food"
                      className="min-h-[100px]"
                      value={formData.idealDestination}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trip dates</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={handleStartDateChange}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>

                      <Select value={formData.duration} onValueChange={handleDurationChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="10">10 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {startDate && endDate && (
                      <p className="text-sm text-muted-foreground">End date: {format(endDate, "PPP")}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="button"
                    className="ml-auto"
                    onClick={() => document.getElementById("preferences-tab")?.click()}
                  >
                    Next: Preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>What do you enjoy?</CardTitle>
                  <CardDescription>
                    Tell us about your interests and preferences to personalize your itinerary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Travel style</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        defaultValue={formData.travelStyle}
                        onValueChange={(val) => setFormData({ ...formData, travelStyle: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pace" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relaxed">Relaxed</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        defaultValue={formData.budget}
                        onValueChange={(val) => setFormData({ ...formData, budget: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">Budget</SelectItem>
                          <SelectItem value="mid">Mid-range</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Budget range (per day)</Label>
                    <Slider
                      defaultValue={formData.budgetAmount}
                      max={500}
                      step={10}
                      onValueChange={(val) => setFormData({ ...formData, budgetAmount: val })}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$50</span>
                      <span>${formData.budgetAmount[0]}</span>
                      <span>$500+</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Interests</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Cultural & Historical",
                        "Nature & Outdoors",
                        "Food & Cuisine",
                        "Art & Museums",
                        "Shopping",
                        "Nightlife",
                        "Adventure Activities",
                        "Relaxation",
                        "Local Experiences",
                        "Photography",
                      ].map((interest) => (
                        <div key={interest} className="flex items-center space-x-2">
                          <Checkbox
                            id={`interest-${interest}`}
                            checked={formData.interests.includes(interest)}
                            onCheckedChange={() => handleCheckboxChange("interests", interest)}
                          />
                          <Label htmlFor={`interest-${interest}`} className="text-sm font-normal">
                            {interest}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Accommodation preferences</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Hotels", "Boutique Hotels", "Hostels", "Apartments", "Resorts", "Ryokans/Traditional"].map(
                        (accommodation) => (
                          <div key={accommodation} className="flex items-center space-x-2">
                            <Checkbox
                              id={`accommodation-${accommodation}`}
                              checked={formData.accommodation.includes(accommodation)}
                              onCheckedChange={() => handleCheckboxChange("accommodation", accommodation)}
                            />
                            <Label htmlFor={`accommodation-${accommodation}`} className="text-sm font-normal">
                              {accommodation}
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("destination-tab")?.click()}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={() => document.getElementById("details-tab")?.click()}>
                    Next: Trip Details
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Final Details</CardTitle>
                  <CardDescription>Add any specific requirements or preferences for your trip</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Transportation preferences</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Public Transport",
                        "Rental Car",
                        "Walking/Biking",
                        "Taxis/Rideshares",
                        "Guided Tours",
                        "Private Transfers",
                      ].map((transport) => (
                        <div key={transport} className="flex items-center space-x-2">
                          <Checkbox
                            id={`transport-${transport}`}
                            checked={formData.transportation.includes(transport)}
                            onCheckedChange={() => handleCheckboxChange("transportation", transport)}
                          />
                          <Label htmlFor={`transport-${transport}`} className="text-sm font-normal">
                            {transport}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dietary restrictions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "Allergies"].map((diet) => (
                        <div key={diet} className="flex items-center space-x-2">
                          <Checkbox
                            id={`diet-${diet}`}
                            checked={formData.dietary.includes(diet)}
                            onCheckedChange={() => handleCheckboxChange("dietary", diet)}
                          />
                          <Label htmlFor={`diet-${diet}`} className="text-sm font-normal">
                            {diet}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">Special requests or must-see attractions</Label>
                    <Textarea
                      id="specialRequests"
                      name="specialRequests"
                      placeholder="e.g., I want to see Mount Fuji, visit hot springs, and try authentic sushi"
                      className="min-h-[100px]"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                    />
                  </div>

                  {!session && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Sign in to save your itinerary and access it later.{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => router.push("/auth/signin?callbackUrl=/planner")}
                        >
                          Sign in
                        </Button>
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("preferences-tab")?.click()}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Itinerary
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  )
}
