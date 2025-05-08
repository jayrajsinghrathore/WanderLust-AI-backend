"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MapPin, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import axios from "axios"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type Destination = {
  id: string | number
  name: string
  description: string
  image: string
  tags: string[]
  budget?: string
  bestTime?: string
  rating?: number
}

export default function DestinationsPage() {
  const { toast } = useToast()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortOption, setSortOption] = useState<string>("default")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState<number[]>([50])
  const [tripDuration, setTripDuration] = useState<number[]>([7])

  useEffect(() => {
    fetchDestinations()
  }, [])

  useEffect(() => {
    filterDestinations()
  }, [destinations, searchQuery, selectedInterests, selectedSeasons, budgetRange, tripDuration])

  const fetchDestinations = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/destinations")
      if (response.data && response.data.destinations) {
        setDestinations(response.data.destinations)
        setFilteredDestinations(response.data.destinations)
      }
    } catch (error) {
      console.error("Error fetching destinations:", error)
      toast({
        title: "Error",
        description: "Failed to load destinations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterDestinations = () => {
    let filtered = [...destinations]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (dest) =>
          dest.name.toLowerCase().includes(query) ||
          dest.description.toLowerCase().includes(query) ||
          dest.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by interests
    if (selectedInterests.length > 0) {
      filtered = filtered.filter((dest) => dest.tags.some((tag) => selectedInterests.includes(tag)))
    }

    // Filter by seasons
    if (selectedSeasons.length > 0) {
      // This is a simplified approach since we don't have season data
      // In a real app, you would filter based on actual season data
      filtered = filtered
    }

    // Sort destinations
    if (sortOption !== "default") {
      filtered = sortDestinations(filtered, sortOption)
    }

    setFilteredDestinations(filtered)
  }

  const sortDestinations = (destinations: Destination[], option: string) => {
    const sorted = [...destinations]

    switch (option) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name))
      case "rating-high":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case "rating-low":
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0))
      case "budget-low":
        // Sort by budget ($ < $$ < $$$)
        return sorted.sort((a, b) => {
          const budgetA = (a.budget || "$$").length
          const budgetB = (b.budget || "$$").length
          return budgetA - budgetB
        })
      case "budget-high":
        return sorted.sort((a, b) => {
          const budgetA = (a.budget || "$$").length
          const budgetB = (b.budget || "$$").length
          return budgetB - budgetA
        })
      default:
        return sorted
    }
  }

  const handleInterestChange = (interest: string) => {
    setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  const handleSeasonChange = (season: string) => {
    setSelectedSeasons((prev) => (prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    filterDestinations()
  }

  const handleApplyFilters = () => {
    filterDestinations()
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDestinations.map((destination) => (
        <Link href={`/destinations/${destination.id}`} key={destination.id}>
          <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
            <div className="relative h-48">
              <Image
                src={destination.image || "/placeholder.svg"}
                alt={destination.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                  {destination.name}
                </CardTitle>
                {destination.rating && (
                  <Badge>
                    {destination.rating >= 4.5 ? "Popular" : destination.rating >= 4.0 ? "Trending" : "New"}
                  </Badge>
                )}
              </div>
              <CardDescription>{destination.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="flex flex-wrap gap-2">
                {destination.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4">
      {filteredDestinations.map((destination) => (
        <Link href={`/destinations/${destination.id}`} key={destination.id}>
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-48 h-48 md:h-auto">
                <Image
                  src={destination.image || "/placeholder.svg"}
                  alt={destination.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    {destination.name}
                  </h3>
                  {destination.rating && (
                    <Badge>
                      {destination.rating >= 4.5 ? "Popular" : destination.rating >= 4.0 ? "Trending" : "New"}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">{destination.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {destination.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {destination.budget && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Budget: {destination.budget} • Best time: {destination.bestTime || "Year-round"}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search destinations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            <div className="space-y-2">
              <Label>Budget Range</Label>
              <Slider defaultValue={budgetRange} max={100} step={1} onValueChange={setBudgetRange} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>$5000+</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trip Duration (days)</Label>
              <Slider defaultValue={tripDuration} max={30} step={1} onValueChange={setTripDuration} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>30+</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="space-y-2">
                {["Beach", "Mountains", "City", "Cultural", "Adventure", "Relaxation", "Food", "History"].map(
                  (interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={selectedInterests.includes(interest)}
                        onCheckedChange={() => handleInterestChange(interest)}
                      />
                      <Label htmlFor={`interest-${interest}`} className="text-sm font-normal">
                        {interest}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Season</Label>
              <div className="space-y-2">
                {["Spring", "Summer", "Fall", "Winter"].map((season) => (
                  <div key={season} className="flex items-center space-x-2">
                    <Checkbox
                      id={`season-${season}`}
                      checked={selectedSeasons.includes(season)}
                      onCheckedChange={() => handleSeasonChange(season)}
                    />
                    <Label htmlFor={`season-${season}`} className="text-sm font-normal">
                      {season}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Discover Destinations</h1>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="rating-high">Rating (High to Low)</SelectItem>
                  <SelectItem value="rating-low">Rating (Low to High)</SelectItem>
                  <SelectItem value="budget-low">Budget (Low to High)</SelectItem>
                  <SelectItem value="budget-high">Budget (High to Low)</SelectItem>
                </SelectContent>
              </Select>
              <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-muted-foreground">
              Discover AI-recommended destinations based on your preferences. Our suggestions consider your interests,
              budget, and travel style.
            </p>
          </div>

          {filteredDestinations.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No destinations found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search criteria to find more destinations.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedInterests([])
                  setSelectedSeasons([])
                  setBudgetRange([50])
                  setTripDuration([7])
                  setSortOption("default")
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            renderGridView()
          ) : (
            renderListView()
          )}

          {filteredDestinations.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" className="mr-2">
                Previous
              </Button>
              <Button variant="outline" className="mx-1">
                1
              </Button>
              <Button variant="outline" className="mx-1">
                2
              </Button>
              <Button variant="outline" className="mx-1">
                3
              </Button>
              <Button variant="outline" className="ml-2">
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
