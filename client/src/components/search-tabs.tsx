import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const SearchTabs = () => {
  return (
    <div className="bg-slate-300 w-full max-w-3xl px-4 py-4 rounded-lg items-center flex flex-col justify-center">
      <div className="flex flex-row gap-1 sm:gap-2 md:gap-4 max-w-2xl">
              <Input 
                placeholder="Search by Name or Hospital"
                className="flex-1 text-xs"
              />
              <Input 
                placeholder="Enter Location"
                className="flex-1 text-xs"
              />
              <Button className="bg-blue-600">
                <Search className="w-1 h-1 md:w-4 md:h-4" />
              </Button>
            </div>
      <div className="flex flex-wrap gap-2 py-3">
      {['General', 'Dentist', 'Massage', 'Orthopedic'].map((tab, index) => (
            <Button
              key={index}
              variant="outline"
              className=" items-center gap-1 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
      </div>
    </div>
  )
}

export default SearchTabs;