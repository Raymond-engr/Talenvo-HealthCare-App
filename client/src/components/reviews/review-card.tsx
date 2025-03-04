// client/src/components/reviews/review-card.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

interface ReviewCardProps {
  author: string
  date: string
  rating: number
  content: string
  avatar?: string
}

export function ReviewCard({ author, rating, content, avatar }: ReviewCardProps) {
  return (
    <div className="py-6 last:border-0">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex flex-col">
            <div className="flex mt-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
              ))}
            </div>
            <p className="text-gray-600 mb-2">{content}</p>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={avatar} />
                <AvatarFallback>{author[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">{author}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}