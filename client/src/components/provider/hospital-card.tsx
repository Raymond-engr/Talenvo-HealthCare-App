// client/src/components/provider/hospital-card.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { BookmarkIcon, MapPin, Star } from "lucide-react"
import Link from "next/link"
import { ImageWithFallback } from "@/components/image-with-fallback"

interface HospitalCardProps {
  id?: string
  name: string
  image: string
  consultationFee?: string
  location: string
  rating: number
  reviews: number
  distance: string
  services?: string
  isSaved?: boolean
}

interface Provider {
  id: string;
  name: string;
  image: string;
  consultationFee: string;
  location: string;
  rating: number;
  reviews: number;
  distance: string;
  services: string;
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
  services = "Healthcare",
  isSaved: initialSavedState = false
}: HospitalCardProps) {
  const [isSaved, setIsSaved] = useState(initialSavedState)

  // Check if this provider is saved when component mounts
  useEffect(() => {
    const savedProviders = JSON.parse(localStorage.getItem('savedProviders') || '[]')
    const isAlreadySaved = savedProviders.some((provider: Provider) => provider.id === id)
    setIsSaved(isAlreadySaved)
  }, [id])

  const toggleSave = () => {
    const savedProviders = JSON.parse(localStorage.getItem('savedProviders') || '[]')
    
    if (isSaved) {
      // Remove provider from saved list
      const updatedSavedProviders = savedProviders.filter((provider: Provider) => provider.id !== id)
      localStorage.setItem('savedProviders', JSON.stringify(updatedSavedProviders))
      setIsSaved(false)
    } else {
      // Add provider to saved list if not already there
      const providerExists = savedProviders.some((provider: Provider) => provider.id === id)
      
      if (!providerExists) {
        const providerData = {
          id,
          name,
          image,
          consultationFee,
          location,
          rating,
          reviews,
          distance,
          services
        }
        
        savedProviders.push(providerData)
        localStorage.setItem('savedProviders', JSON.stringify(savedProviders))
      }
      
      setIsSaved(true)
    }
  }

  return (
    <Card className="overflow-hidden border rounded-lg bg-white">
      <div className="relative">
        <div className="relative h-44">
          <ImageWithFallback
            src={image}
            alt={name}
            fill
            className="object-cover"
            fallbackSrc="/placeholder.svg"
          />
          <div className="absolute top-2 right-2">
            <button 
              className={`p-1 rounded-full ${isSaved ? 'bg-blue-600' : 'bg-white'}`}
              onClick={toggleSave}
            >
              <BookmarkIcon className={`w-4 h-4 ${isSaved ? 'text-white fill-white' : ''}`} />
            </button>
          </div>
          <div className="absolute top-2 left-2 bg-white py-1 px-2 rounded text-xs font-medium">
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
        
        {consultationFee && (
          <p className="text-sm text-gray-700 mt-1">Consultation fee: {consultationFee}</p>
        )}
        
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