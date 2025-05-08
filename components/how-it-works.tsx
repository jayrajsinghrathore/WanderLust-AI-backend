import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Calendar, MapPin, Globe } from "lucide-react"

const steps = [
  {
    title: "Tell us your preferences",
    description: "Share your interests, budget, and travel style to get personalized recommendations.",
    icon: Search,
  },
  {
    title: "Discover destinations",
    description: "Explore AI-suggested destinations that match your unique preferences.",
    icon: Globe,
  },
  {
    title: "Create your itinerary",
    description: "Get a customized day-by-day plan with activities, accommodations, and transportation.",
    icon: Calendar,
  },
  {
    title: "Enjoy real-time assistance",
    description: "Receive location-based recommendations and translation help during your trip.",
    icon: MapPin,
  },
]

export default function HowItWorks() {
  return (
    <section className="py-16 px-4 sm:px-6 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform makes travel planning simple and personalized
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={index} className="border-none bg-background shadow-sm">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="flex items-center">
                    <span className="text-primary mr-2">{index + 1}.</span> {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{step.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
