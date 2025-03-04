// client/src/app/provider/[id]/page.tsx
import { ProviderHeader } from "@/components/provider/provider-header"
import { DepartmentList } from "@/components/provider/department-list"
import { Globe, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { BookmarkIcon } from "lucide-react"

// Type definition for provider data
interface ProviderData {
  uniqueId: string;
  name: string;
  photo?: string;
  institutionType: string;
  ownershipType: string;
  location: {
    address: {
      streetAddress: string;
      city: string;
      state: string;
      country: string;
    };
    coordinates: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  contactInfo: {
    phoneNumbers: string[];
    email?: string;
    website?: string;
  };
  operatingHours: Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isOpen24Hours?: boolean;
  }>;
  serviceCapabilities: {
    specialties: string[];
    appointmentBooking: {
      available: boolean;
      methods: string[];
    };
    emergencyServices: boolean;
    languages: string[];
  };
  rating?: number;
  reviews?: number;
}

// Mock function - replace with actual API call
async function getProviderData(id: string): Promise<ProviderData> {
  return {
    uniqueId: id,
    name: "Ikeja General Hospital",
    photo: "/assets/hospital-sign.jpg",
    institutionType: "hospital",
    ownershipType: "public",
    location: {
      address: {
        streetAddress: "Opebi Link Road",
        city: "Ikeja",
        state: "Lagos",
        country: "Nigeria"
      },
      coordinates: {
        type: 'Point',
        coordinates: [3.35, 6.60]
      }
    },
    contactInfo: {
      phoneNumbers: ["08012345678", "09012345678"],
      email: "ikejagenhospital@gmail.com",
      website: "www.ikejageneral.com"
    },
    operatingHours: [
      { day: "Monday", openTime: "8:00", closeTime: "17:00", isOpen24Hours: false }
    ],
    serviceCapabilities: {
      specialties: ["Oncology", "Pediatrics", "Orthopedics", "General Medicine", "Maternity Care"],
      appointmentBooking: {
        available: true,
        methods: ["online", "phone"]
      },
      emergencyServices: true,
      languages: ["English", "Yoruba"]
    },
    rating: 5,
    reviews: 120
  };
}

export default async function ProviderPage({ params }: { params: { id: string } }) {
  const provider = await getProviderData(params.id);
  
  const departments = provider.serviceCapabilities.specialties.map(specialty => ({
    name: specialty,
    description: `${specialty} services and treatments.`,
    icon: "Activity"
  }));
  
  const is24Hours = provider.operatingHours.some(hour => hour.isOpen24Hours);

  return (
    <main className="min-h-screen pb-8">
      <ProviderHeader
        name={provider.name}
        rating={provider.rating || 0}
        reviews={provider.reviews || 0}
        image={provider.photo || "/placeholder.svg"}
      />

      <div className="container px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold">Overview</h2>
                <div className="flex ml-auto space-x-2">
                  <Link href={`/provider/${params.id}/reviews`} className="text-gray-600 text-sm">
                    Review ({provider.reviews || 0})
                  </Link>
                </div>
              </div>
              <p className="text-gray-600">
                {provider.name} is a leading healthcare facility offering a wide range of medical services, from
                outpatient care to specialized surgeries. Established with a mission to provide accessible and high-quality healthcare
                services to the community.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">
                Contact Details 
                {is24Hours && <span className="text-sm font-normal text-gray-500 ml-2">(Open 24/7)</span>}
              </h2>
              <div className="space-y-3">
                {provider.location?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span>
                      {provider.location.address.streetAddress}, {provider.location.address.city} 
                      <Link href="#" className="text-blue-600 ml-2 text-sm">Get Directions</Link>
                    </span>
                  </div>
                )}
                
                {provider.contactInfo?.phoneNumbers && provider.contactInfo.phoneNumbers.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{provider.contactInfo.phoneNumbers.join(', ')}</span>
                  </div>
                )}
                
                {provider.contactInfo?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span>{provider.contactInfo.email}</span>
                  </div>
                )}
                
                {provider.contactInfo?.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <span>{provider.contactInfo.website}</span>
                  </div>
                )}
              </div>
            </section>

            {provider.serviceCapabilities?.specialties && provider.serviceCapabilities.specialties.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Departments</h2>
                <DepartmentList departments={departments} />
              </section>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-4">Nearby Providers</h3>
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Link href="#" key={i} className="block relative">
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <Image 
                        src={i === 1 ? "/assets/hospital-exterior.jpg" : "/assets/hospital-staff.jpg"} 
                        alt="Nearby hospital" 
                        fill 
                        className="object-cover" 
                      />
                      <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full">
                        <BookmarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-medium">Ikeja General Hospital</h4>
                      <p className="text-sm text-gray-500">(3 miles away)</p>
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