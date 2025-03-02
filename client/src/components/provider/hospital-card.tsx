import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { BookmarkIcon, MapPin, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface HospitalCardProps {
  id?: string
  name: string
  image: string
  consultationFee: string
  location: string
  rating: number
  reviews: number
  distance: string
  services: string
}

export function HospitalCard({ 
  id = "1", 
  name, 
  image, 
  consultationFee, 
  location, 
  rating, 
  reviews, 
  distance,
  services
}: HospitalCardProps) {
  return (
    <Card className="overflow-hidden border rounded-lg">
      <div className="relative">
        <div className="relative h-44">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <BookmarkIcon className="w-5 h-5 text-white" />
          </div>
          <div className="absolute top-2 left-2 bg-white py-1 px-2 rounded-md text-sm">
            {distance}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded inline-block mb-2">
          {services}
        </div>
        
        <Link href={`/provider/${id}`}>
          <h3 className="font-semibold text-lg">{name}</h3>
        </Link>
        
        <p className="text-sm text-gray-700 mt-1">Constlation fee: {consultationFee}</p>
        
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <p className="text-sm text-gray-500">{location}</p>
        </div>
        
        <div className="flex items-center mt-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">({reviews})</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">Book Appointment</Button>
      </CardFooter>
    </Card>
  )
}