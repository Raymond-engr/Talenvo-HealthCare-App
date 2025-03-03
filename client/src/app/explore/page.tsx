"use client"

import { FilterSidebar } from "@/components/filter/filter-sidebar"
import ExploreSearchTabs from "@/components/explore-search-tabs"
import { HospitalCard } from "@/components/provider/hospital-card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState } from "react"

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
    image: "/assets/hospital-surgery.jpg", // Surgery sign image
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
    image: "/assets/hospital-staff.jpg", // Hospital staff image
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
    image: "/assets/hospital-exterior2.jpg", // Another hospital exterior image
    consultationFee: "$5.00 - $15.00",
    location: "Opeki Link Road, Ikeja",
    rating: 5,
    reviews: 120,
    distance: "3.5 miles",
    services: "General Services"
  }
]

export default function ExplorePage() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Find Healthcare Services</h1>
        
        <ExploreSearchTabs onAdvancedFiltersClick={() => setIsFiltersOpen(true)} />
        
        {/* Filter Sheet */}
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <FilterSidebar onClose={() => setIsFiltersOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="mt-6">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
    </main>
  )
}