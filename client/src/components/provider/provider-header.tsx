// client/src/components/provider/provider-header.tsx
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Star, BookmarkIcon } from "lucide-react"
import { ImageWithFallback } from "@/components/image-with-fallback"
import Doc2 from "../../../public/assets/doc2.png"

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
        <Image src={Doc2} alt="Hospital banner" fill className="object-cover opacity-20" />
      </div>
      <div className="container px-4">
        <div className="flex flex-col md:flex-row gap-2 md:gap-6 -mt-16 items-start">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white">
            <ImageWithFallback
              src={Doc2 || image}
              alt={name}
              fill
              className="object-cover"
              fallbackSrc="/placeholder.svg"
            />
          </div>
          <div className="flex-1 pt-1 md:pt-20">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <h1 className="text-2xl font-bold">{name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({reviews} reviews)</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-blue-600 hover:bg-blue-700">Book Appointment</Button>
                <button className="p-2 border rounded-md">
                  <BookmarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}