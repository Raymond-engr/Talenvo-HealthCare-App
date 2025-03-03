"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search } from "lucide-react"
import { useState } from "react"

interface FilterSidebarProps {
  onClose: () => void
}

export function FilterSidebar({ onClose }: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState({
    specialization: true,
    consultationFees: false,
    distance: false,
    acceptedInsurance: false,
    averageRating: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApply = () => {
    console.log("Filters applied");
    onClose()
  }

  const handleClear = () => {
    console.log("Filters cleared");
    onClose()
  }

  return (
    <div className="space-y-4">
      {/* Specialization Section */}
      <div className="border-b pb-4 pt-10">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('specialization')}
        >
          <h3 className="font-medium">Specialization</h3>
          <ChevronDown className={`w-5 h-5 transform transition-transform ${openSections.specialization ? 'rotate-180' : ''}`} />
        </div>
        
        {openSections.specialization && (
          <div className="mt-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search" className="pl-8" />
            </div>
            <div className="space-y-2 mt-3">
              {["Radiography", "General Medicine", "Orthopedics", "Pediatrician"].map((spec) => (
                <div key={spec} className="text-sm">
                  {spec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Consultation Fees Section */}
      <div className="border-b pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('consultationFees')}
        >
          <h3 className="font-medium">Consultation Fees</h3>
          <ChevronDown className={`w-5 h-5 transform transition-transform ${openSections.consultationFees ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Distance Section */}
      <div className="border-b pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('distance')}
        >
          <h3 className="font-medium">Distance</h3>
          <ChevronDown className={`w-5 h-5 transform transition-transform ${openSections.distance ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Accepted Insurance Section */}
      <div className="border-b pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('acceptedInsurance')}
        >
          <h3 className="font-medium">Accepted Insurance</h3>
          <ChevronDown className={`w-5 h-5 transform transition-transform ${openSections.acceptedInsurance ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Average Rating Section */}
      <div className="border-b pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('averageRating')}
        >
          <h3 className="font-medium">Average Rating</h3>
          <ChevronDown className={`w-5 h-5 transform transition-transform ${openSections.averageRating ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button 
          variant="outline" 
          className="flex-1 text-sm"
          onClick={handleClear}
        >
          Clear All
        </Button>
        <Button 
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
          onClick={handleApply}
        >
          Apply Filter
        </Button>
      </div>
    </div>
  )
}