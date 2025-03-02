import { Button } from '@/components/ui/button'
import { AutoResizeTextarea } from '../components/ui/AutoResizeTextArea'
import { Search, MapPin } from 'lucide-react'

const items = ["Dentist", "Radiology", "Doctor", "Massage"];

const SearchTabs = () => {
  return (
    <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-row gap-3 mb-3">
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
        <Button className="bg-blue-600 px-3 py-2 min-w-10">
          <Search className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="pt-2">
    <div className="text-sm text-gray-500 mb-2">You may be looking for</div>
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className={i >= 3 ? "hidden sm:block" : ""}
        >
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-100 text-gray-700 rounded-md px-3 py-1 text-xs flex items-center gap-1"
          >
            {item}
            <span className="text-gray-400">×</span>
          </Button>
        </div>
      ))}
    </div>
  </div>
    </div>
  )
}

export default SearchTabs;