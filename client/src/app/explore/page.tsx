import { HospitalCard } from "@/components/provider/hospital-card"
import { FilterSidebar } from "@/components/filter/filter-sidebar"
import SearchTabs from "@/components/search-tabs"

const hospitals = [
  {
    name: "Raja General Hospital",
    image: "/placeholder.svg",
    consultationTime: "Available Dec 10:00 - 17:00",
    price: "$50"
  },
  {
    name: "Raja General Hospital",
    image: "/placeholder.svg",
    consultationTime: "Available Dec 10:00 - 17:00",
    price: "$50"
  },
  {
    name: "Raja General Hospital",
    image: "/placeholder.svg",
    consultationTime: "Available Dec 10:00 - 17:00",
    price: "$50"
  },
  // Add more hospitals as needed
]

export default function ExplorePage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Find Healthcare Services</h1>
        
        <SearchTabs />
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <FilterSidebar />

          <div className="flex-1">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital, index) => (
            <HospitalCard key={index} {...hospital} />
          ))}
           </div>
          </div>
        </div>
      </div>
    </main>
  )
}