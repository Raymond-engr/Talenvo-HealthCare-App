"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { useState } from "react"

export function ReviewForm() {
  const [rating, setRating] = useState(0)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Add a Review</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} onClick={() => setRating(value)} className="p-1">
            <Star className={`w-6 h-6 ${value <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
      <Textarea placeholder="Share your experience with this provider..." className="min-h-[100px]" />
      <Button>Submit Review</Button>
    </div>
  )
}

