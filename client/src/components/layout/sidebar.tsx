import Link from 'next/link'
import { Home, Search, BookmarkIcon, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

const Sidebar = ({ className }: SidebarProps) => {
  return (
    <div className={cn("hidden sm:flex flex-col p-4 border-r h-screen sticky z-20 top-16 w-[140px] bg-white", className)}>
      <nav className="flex flex-col gap-2">
        <Link 
          href="/"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100"
        >
          <Home className="w-5 h-5 text-gray-900" />
          <span>Home</span>
        </Link>
        <Link 
          href="/explore"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100"
        >
          <Search className="w-5 h-5 text-gray-900" />
          <span>Explore</span>
        </Link>
        <Link 
          href="/saved"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100"
        >
          <BookmarkIcon className="w-5 h-5 text-gray-900" />
          <span>Saved</span>
        </Link>
        <Link 
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100"
        >
          <User className="w-5 h-5 text-gray-900" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  )
}

export default Sidebar;