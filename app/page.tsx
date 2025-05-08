import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import FeaturedDestinations from "@/components/featured-destinations"
import HowItWorks from "@/components/how-it-works"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full">
        <Image
          src="/placeholder.svg?height=600&width=1200"
          alt="Beautiful travel destination"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">Discover Your Perfect Journey</h1>
          <p className="text-xl text-white mb-8 max-w-2xl">
            Personalized travel recommendations, itineraries, and real-time assistance powered by AI.
          </p>

          <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-lg p-2">
            <Tabs defaultValue="destination" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-2">
                <TabsTrigger value="destination">Destination</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="translate">Translate</TabsTrigger>
              </TabsList>
              <TabsContent value="destination" className="mt-0">
                <form className="flex space-x-2">
                  <Input placeholder="Where do you want to go?" className="bg-white/80 border-0" />
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="itinerary" className="mt-0">
                <form className="flex space-x-2">
                  <Input placeholder="Plan a trip to..." className="bg-white/80 border-0" />
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Plan
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="translate" className="mt-0">
                <form className="flex space-x-2">
                  <Input placeholder="Enter text to translate..." className="bg-white/80 border-0" />
                  <Button type="submit">Translate</Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <FeaturedDestinations />

      {/* How It Works */}
      <HowItWorks />

      {/* Call to Action */}
      <section className="bg-primary/10 py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Adventure?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Create your personalized travel plan in minutes with our AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/destinations">Explore Destinations</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/planner">Create Itinerary</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
