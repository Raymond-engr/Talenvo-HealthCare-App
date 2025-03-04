"use client"

import { useState, useEffect } from "react"
import { HospitalCard } from "@/components/provider/hospital-card"

export default function SavedPage() {
  const [savedProviders, setSavedProviders] = useState<any[]>([])
  
  // Load saved providers from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedProviders')
    if (saved) {
      setSavedProviders(JSON.parse(saved))
    }
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Saved Providers</h1>
        
        <div className="mt-6">
          {savedProviders.length > 0 ? (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {savedProviders.map((provider) => (
                <HospitalCard 
                  key={provider.id}
                  id={provider.id}
                  name={provider.name}
                  image={provider.image}
                  consultationFee={provider.consultationFee}
                  location={provider.location}
                  rating={provider.rating}
                  reviews={provider.reviews}
                  distance={provider.distance}
                  services={provider.services}
                  isSaved={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">You haven&apos;t saved any providers yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}