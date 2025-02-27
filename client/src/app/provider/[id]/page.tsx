import { ProviderHeader } from "@/components/provider/provider-header"
import { DepartmentList } from "@/components/provider/department-list"
import { Globe, Mail, MapPin, Phone, BookmarkIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProviderPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen pb-8">
      <ProviderHeader
        name="Ikeja General Hospital"
        rating={4.5}
        reviews={1205}
        image="/hospital-image.jpg"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <p className="text-gray-600">
                Ikeja General Hospital is a leading healthcare facility offering a wide range of medical services, from
                outpatient care to specialized surgeries. Established in 1985, we have served over 500,000 patients with
                compassion and expertise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Details <span className="text-sm font-normal text-gray-500">(Open 24/7)</span></h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span>Opelo Link Road, Ikeja <Link href="#" className="text-blue-600 ml-2 text-sm">Get Directions</Link></span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span>08012345678, 09012345678</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span>ikejagenhospital@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <span>www.ikejageneral.com</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Departments</h2>
              <DepartmentList />
            </section>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-4">Nearby Providers</h3>
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Link href="#" key={i} className="block relative">
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <Image src="/placeholder.svg" alt="Nearby hospital" fill className="object-cover" />
                      <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full">
                        <BookmarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-medium">Ikeja General Hospital</h4>
                      <p className="text-sm text-gray-500">(7 miles away)</p>
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