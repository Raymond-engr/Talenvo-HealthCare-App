'use client';

import Link from 'next/link'
import { Home, Search, BookmarkIcon, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  className?: string
}

const Sidebar = ({ className }: SidebarProps) => {
  const pathname = usePathname()

  const getLinkClass = (route: string) => {
    return pathname === route 
      ? 'bg-blue-100 text-blue-600' 
      : 'text-gray-900 hover:bg-blue-100'
  }

  return (
    <div className={cn("hidden sm:flex flex-col p-4 border-r h-screen sticky z-20 top-0 w-[80px] bg-white", className)}>
      <nav className="flex flex-col items-center gap-6">
        <Link 
          href="/"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${getLinkClass('/')}`}
        >
          <Home className={`w-5 h-5 ${pathname === '/' ? 'text-blue-600' : 'text-current'}`} />
          <span className="text-xs">Home</span>
        </Link>
        <Link 
          href="/explore"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${getLinkClass('/explore')}`}
        >
          <Search className={`w-5 h-5 ${pathname === '/explore' ? 'text-blue-600' : 'text-current'}`} />
          <span className="text-xs">Explore</span>
        </Link>
        <Link 
          href="/saved"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${getLinkClass('/saved')}`}
        >
          <BookmarkIcon className={`w-5 h-5 ${pathname === '/saved' ? 'text-blue-600' : 'text-current'}`} />
          <span className="text-xs">Saved</span>
        </Link>
        <Link 
          href="/profile"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${getLinkClass('/profile')}`}
        >
          <User className={`w-5 h-5 ${pathname === '/profile' ? 'text-blue-600' : 'text-current'}`} />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  )
}

export default Sidebar