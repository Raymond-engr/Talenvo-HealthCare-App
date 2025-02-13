import { ProviderHeader } from "@/components/provider/provider-header"
import { DepartmentList } from "@/components/provider/department-list"
import { Button } from "@/components/ui/button"
import { Globe, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProviderPage({ params }: { params: { id: string } }) {
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
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <p className="text-gray-600">
                Ikeja General Hospital is a leading healthcare facility offering a wide range of medical services and
                specialized care to thousands of patients. Established in 1969, we provide excellent medical care with
                state-of-the-art facilities and expert healthcare professionals.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Details</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span>Opolo Link Road, Ikeja</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span>(080) 2345-67 (234) 5678-90</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span>hospital@ikeja.govt.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <span>www.ikejahospital.com</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Departments</h2>
              <DepartmentList />
            </section>
          </div>

          <div className="space-y-8">
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Book a consultation</h3>
              <Button className="w-full">Book Appointment</Button>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Nearby Providers</h3>
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Link href="#" key={i} className="block">
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <Image src="/placeholder.svg" alt="Nearby hospital" fill className="object-cover" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

