"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { FilterIcon } from "lucide-react"

export function FilterSidebar() {
  return (
    <div className="w-full lg:w-[300px] flex-shrink-0">
      {/* Mobile Filter Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden mb-4 w-full">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[300px] lg:hidden">
          <FilterContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>
    </div>
  )
}

function FilterContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Specialization</h3>
        <Input placeholder="Search specializations" className="mb-4" />
        <div className="space-y-3">
          {["Oncology", "Cardiology", "Pediatrics", "Orthopedics", "General Medicine"].map((spec) => (
            <div key={spec} className="flex items-center space-x-2">
              <Checkbox id={spec} />
              <label htmlFor={spec} className="text-sm">
                {spec}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Consultation Fee</h3>
        <Slider defaultValue={[50]} max={200} step={10} />
        <div className="flex justify-between mt-2">
          <span className="text-sm">$0</span>
          <span className="text-sm">$200</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Distance</h3>
        <Slider defaultValue={[5]} max={20} step={1} />
        <div className="flex justify-between mt-2">
          <span className="text-sm">0 km</span>
          <span className="text-sm">20 km</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1">
          Clear All
        </Button>
        <Button className="flex-1">Apply Filter</Button>
      </div>
    </div>
  )
}

