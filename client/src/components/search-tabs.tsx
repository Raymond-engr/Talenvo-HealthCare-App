import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const SearchTabs = () => {
  return (
    <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Input 
            placeholder="Search by Name or Hospital"
            className="pl-3 pr-8 py-2 w-full"
          />
        </div>
        <div className="relative flex-1">
          <Input 
            placeholder="Enter Location"
            className="pl-3 pr-8 py-2 w-full"
          />
        </div>
        <Button className="bg-blue-600 px-3 py-2 min-w-10">
          <Search className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="pt-2">
        <div className="text-sm text-gray-500 mb-2">You may be looking for</div>
        <div className="flex flex-wrap gap-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-100 text-gray-700 rounded-md px-3 py-1 text-xs flex items-center gap-1"
              >
                Dentist
                <span className="text-gray-400">×</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-100 text-gray-700 rounded-md px-3 py-1 text-xs flex items-center gap-1"
              >
                Radiology
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