// client/src/app/provider/[id]/reviews/page.tsx
"use client"

import { useState, useEffect } from "react"
import { ProviderHeader } from "@/components/provider/provider-header"
import { ReviewCard } from "@/components/reviews/review-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const reviews = [
  {
    author: "Anthony Joshua",
    date: "December 24, 2024",
    rating: 5,
    content:
      "The pediatric team at this hospital is amazing! They made my son feel completely at ease during his checkup. The doctors were patient, thorough, and incredibly kind. I can't thank them enough",
  },
  {
    author: "Usain Bolt",
    date: "December 24, 2024",
    rating: 5,
    content:
      "The cardiology department provided top-notch care for my father's heart condition. The doctors explained every step of the treatment clearly, and the nurses were very attentive. Highly recommend",
  },
  {
    author: "Usain Bolt",
    date: "December 24, 2024",
    rating: 5,
    content:
      "The cardiology department provided top-notch care for my father's heart condition. The doctors explained every step of the treatment clearly, and the nurses were very attentive. Highly recommend",
  }
]

// Mock function - replace with actual API call
async function getProviderData(id: string) {
  return {
    name: "Ikeja General Hospital",
    photo: "/assets/hospital-sign.jpg",
    rating: 5,
    reviews: 120
  };
}

export default function ReviewsPage({ params }: { params: { id: string } }) {
  const [provider, setProvider] = useState<any>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await getProviderData(params.id)
      setProvider(data)
    }
    
    fetchData()
  }, [params.id])
  
  if (!provider) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  return (
    <main className="min-h-screen pb-8">
      <ProviderHeader
        id={params.id}
        name={provider.name}
        rating={provider.rating}
        reviews={provider.reviews}
        image={provider.photo}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center mb-4">
              <Link href={`/provider/${params.id}`} className="text-gray-600 text-sm">
                Overview
              </Link>
              <div className="flex ml-4 space-x-2">
                <span className="text-blue-600 font-medium text-sm border-b-2 border-blue-600 pb-1">
                  Review ({provider.reviews || 0})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div></div>
              <Select defaultValue="recent">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="divide-y">
              {reviews.map((review, index) => (
                <ReviewCard key={index} {...review} />
              ))}
            </div>

            <Button variant="outline" className="w-full mt-6">
              Load More
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}