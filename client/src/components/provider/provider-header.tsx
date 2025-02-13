import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

interface ProviderHeaderProps {
  name: string
  rating: number
  reviews: number
  image: string
}

export function ProviderHeader({ name, rating, reviews, image }: ProviderHeaderProps) {
  return (
    <div className="relative">
      <div className="h-[200px] w-full relative bg-blue-600">
        <Image src="/placeholder.svg" alt="Hospital banner" fill className="object-cover opacity-20" />
      </div>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6 -mt-16 items-start">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white">
            <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
          </div>
          <div className="flex-1 pt-4 md:pt-0">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <h1 className="text-2xl font-bold">{name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({reviews} reviews)</span>
                </div>
              </div>
              <Button>Book Appointment</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

