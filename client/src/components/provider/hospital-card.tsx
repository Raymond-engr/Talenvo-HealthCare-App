import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

interface HospitalCardProps {
  name: string
  image: string
  consultationTime: string
  price: string
  id?: string
}

export function HospitalCard({ name, image, consultationTime, price, id = "1" }: HospitalCardProps) {
  return (
    <Card className="overflow-hidden">
       <Link href={`/provider/${id}`}>
      <div className="relative h-48">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-gray-500">Consultation fee: {price}</p>
        <p className="text-sm text-gray-500">{consultationTime}</p>
      </CardContent>
       </Link>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">Book Appointment</Button>
      </CardFooter>
    </Card>
  )
}