'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

export function SearchTabs() {
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <Input 
            className="pl-10" 
            placeholder="Search for doctors, hospitals, specialties..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap">
          {['General', 'Dentist', 'Massage', 'Orthopedic', 'Massage'].map((tab, index) => (
            <Button
              key={index}
              variant="outline"
              className="whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}