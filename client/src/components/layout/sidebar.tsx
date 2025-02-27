import Link from 'next/link'
import { Home, Search, BookmarkIcon, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("hidden lg:flex flex-col p-4 border-r h-screen sticky top-0 w-[240px]", className)}>
      <Link href="/" className="flex items-center gap-2 px-2 mb-8">
        <span className="font-bold text-xl">TALENVO</span>
      </Link>
      
      <nav className="flex flex-col gap-2">
        <Link 
          href="/"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link 
          href="/explore"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
        >
          <Search className="w-5 h-5" />
          <span>Explore</span>
        </Link>
        <Link 
          href="/saved"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
        >
          <BookmarkIcon className="w-5 h-5" />
          <span>Saved</span>
        </Link>
        <Link 
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  )
}