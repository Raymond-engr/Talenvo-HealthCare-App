import { FilterSidebar } from "@/components/filter/filter-sidebar"
import ExploreSearchTabs from "@/components/explore-search-tabs"
import { HospitalCard } from "@/components/provider/hospital-card"

// Updated hospital data to match the images
const hospitals = [
  {
    id: "1",
    name: "Ikeja General Hospital",
    image: "/assets/hospital-sign.jpg", // Hospital sign image
    consultationFee: "$5.00 - $15.00",
    location: "Opeki Link Road, Ikeja",
    rating: 5,
    reviews: 120,
    distance: "3.5 miles",
    services: "General Services"
  },
  {
    id: "2",
    name: "Ikeja General Hospital",
    image: "/assets/hospital-room.jpg", // Hospital room image
    consultationFee: "$5.00 - $15.00",
    location: "Opeki Link Road, Ikeja",
    rating: 5,
    reviews: 120,
    distance: "3.5 miles",
    services: "General Services"
  },
  {
    id: "3",
    name: "Ikeja General Hospital",
    image: "/assets/hospital-exterior.jpg", // Hospital exterior image
    consultationFee: "$5.00 - $15.00",
    location: "Opeki Link Road, Ikeja",
    rating: 5,
    reviews: 120,
    distance: "3.5 miles",
    services: "General Services"
  },
  {
    id: "4",
    name: "Ikeja General Hospital",
    image: "/assets/hospital-exterior2.jpg", // Another hospital exterior image
    consultationFee: "$5.00 - $15.00",
    location: "Opeki Link Road, Ikeja",
    rating: 5,
    reviews: 120,
    distance: "3.5 miles",
    services: "General Services"
  },
  {
    id: "5",
    name: "Ikeja General Hospital",
    image: "/assets/surgery-sign.jpg", // Surgery sign image
    consultationFee: "$5.00 - $15.00",
    location: "Opeki Link Road, Ikeja",
    rating: 5,
    reviews: 120,
    distance: "3.5 miles",
    services: "General Services"
  },
  {
    id: "6",
    name: "Ikeja General Hospital",
    image: "/assets/hospital-staff.jpg", // Hospital staff image
    consultationFee: "$5.00 - $15.00",
    location: "Opeki Link Road, Ikeja",
    rating: 5,
    reviews: 120,
    distance: "3.5 miles",
    services: "General Services"
  }
]

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Find Healthcare Services</h1>
        
        <ExploreSearchTabs />
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <FilterSidebar />

          <div className="flex-1">
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((hospital, index) => (
                <HospitalCard key={index} {...hospital} />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white">
                  1
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}