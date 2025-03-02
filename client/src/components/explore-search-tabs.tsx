import { Button } from '@/components/ui/button'
import { AutoResizeTextarea } from '../components/ui/AutoResizeTextArea'
import { MapPin, Search, SlidersHorizontal } from 'lucide-react'

const ExploreSearchTabs = () => {
  return (
    <div className="w-full bg-white rounded-lg p-4">
      <div className="flex flex-row gap-2 sm:gap-3 mb-3">
      <div className="relative flex-1">
      <div className="absolute left-3 top-3">
        <Search className="w-4 h-4 text-blue-900" />
      </div>
      <AutoResizeTextarea
        placeholder="Search by name of hospital"
        className="pl-10 pr-3 text-xs sm:text-sm"
      />
    </div>
    <div className="relative flex-1">
      <div className="absolute left-3 top-3">
        <MapPin className="w-4 h-4 text-blue-900" />
      </div>
      <AutoResizeTextarea
        placeholder="Enter Location"
        className="pl-10 pr-3 text-xs sm:text-sm"
      />
    </div>
        <Button className="text-gray-900 border bg-white hover:bg-gray-50 px-3 py-2">
          <SlidersHorizontal className="w-4 h-4 md:mr-2 text-blue-900" />
          <span className="hidden md:inline">Advanced Filters</span>
        </Button>
      </div>
    </div>
  )
}

export default ExploreSearchTabs;