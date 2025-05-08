import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { MapPin } from "lucide-react"

const destinations = [
  {
    id: 1,
    name: "Kyoto, Japan",
    description: "Ancient temples, traditional gardens, and vibrant culture",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Historical", "Cultural", "Scenic"],
  },
  {
    id: 2,
    name: "Santorini, Greece",
    description: "Stunning white buildings, blue domes, and breathtaking sunsets",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Beach", "Romantic", "Scenic"],
  },
  {
    id: 3,
    name: "Banff, Canada",
    description: "Majestic mountains, crystal-clear lakes, and abundant wildlife",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Nature", "Adventure", "Hiking"],
  },
  {
    id: 4,
    name: "Barcelona, Spain",
    description: "Unique architecture, vibrant street life, and delicious cuisine",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Urban", "Cultural", "Food"],
  },
]

export default function FeaturedDestinations() {
  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Destinations</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our handpicked selection of amazing places to visit around the world
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination) => (
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
                  <CardTitle className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    {destination.name}
                  </CardTitle>
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

        <div className="text-center mt-10">
          <Link href="/destinations" className="text-primary font-medium hover:underline">
            View all destinations →
          </Link>
        </div>
      </div>
    </section>
  )
}
