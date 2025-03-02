'use client';

import Link from 'next/link'
import { Home, Search, BookmarkIcon, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

const MobileNav = () => {
  const pathname = usePathname()

  const getLinkStyles = (route: string) => {
    return pathname === route ? 'text-blue-600' : 'text-gray-500'
  }

  return (
    <div className="fixed z-50 bottom-0 left-0 right-0 border-t bg-white sm:hidden">
      <nav className="flex justify-around py-2">
        <Link href="/" className="flex flex-col items-center gap-1 px-3 py-2">
          <Home className={`w-5 h-5 ${getLinkStyles('/')}`} />
          <span className={`text-xs ${getLinkStyles('/')}`}>Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1 px-3 py-2">
          <Search className={`w-5 h-5 ${getLinkStyles('/explore')}`} />
          <span className={`text-xs ${getLinkStyles('/explore')}`}>Explore</span>
        </Link>
        <Link href="/saved" className="flex flex-col items-center gap-1 px-3 py-2">
          <BookmarkIcon className={`w-5 h-5 ${getLinkStyles('/saved')}`} />
          <span className={`text-xs ${getLinkStyles('/saved')}`}>Saved</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 px-3 py-2">
          <User className={`w-5 h-5 ${getLinkStyles('/profile')}`} />
          <span className={`text-xs ${getLinkStyles('/profile')}`}>Profile</span>
        </Link>
      </nav>
    </div>
  )
}

export default MobileNav