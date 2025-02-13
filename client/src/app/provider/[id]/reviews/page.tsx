import { ProviderHeader } from "@/components/provider/provider-header"
import { ReviewCard } from "@/components/reviews/review-card"
import { ReviewForm } from "@/components/reviews/review-form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const reviews = [
  {
    author: "Johnny Joshua",
    date: "December 15, 2024",
    rating: 5,
    content:
      "The healthcare team at this hospital is amazing! They made me feel well-cared for throughout my stay. The facilities were clean and modern, and the nursing staff was exceptional.",
  },
  {
    author: "Sarah Beth",
    date: "December 14, 2024",
    rating: 4,
    content:
      "Had a great experience with the cardiology department. The doctors were knowledgeable and took time to explain everything. Only minor issue was the waiting time.",
  },
]

export default function ReviewsPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen pb-8">
      <ProviderHeader
        name="Ikeja General Hospital"
        rating={4.5}
        reviews={1205}
        image="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Providerdetails.PNG-udrffLNItKGoK72eNIP2jvBir7QyXJ.png"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Reviews (1,205)</h2>
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

          <div>
            <ReviewForm />
          </div>
        </div>
      </div>
    </main>
  )
}

