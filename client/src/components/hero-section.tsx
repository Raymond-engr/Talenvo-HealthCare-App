import { Button } from "@/components/ui/button"
import Image from "next/image"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Your Path to
              <span className="text-blue-600"> Affordable Healthcare</span>
              <br />
              Starts Here
            </h1>
            <p className="text-gray-600 text-lg md:text-xl">
              Easily locate doctors, get booking and tracking of scheduled appointments all in one place
            </p>
            <div className="flex gap-4">
              <Button size="lg">Book Appointment</Button>
            </div>
          </div>
          <div className="relative h-[300px] md:h-[400px] lg:h-[500px]">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Homepage.PNG-yN2h92j5lMemfq4oro0I0Iuput8dRB.png"
              alt="Healthcare Professional"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}