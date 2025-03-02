import Link from 'next/link'
import { Home, Search, BookmarkIcon, User } from 'lucide-react'

const MobileNav = () => {
  return (
    <div className="fixed z-50 bottom-0 left-0 right-0 border-t bg-white sm:hidden">
      <nav className="flex justify-around py-2">
        <Link href="/" className="flex flex-col items-center gap-1 px-3 py-2">
          <Home className="w-5 h-5 text-gray-900" />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1 px-3 py-2">
          <Search className="w-5 h-5 text-gray-900" />
          <span className="text-xs">Explore</span>
        </Link>
        <Link href="/saved" className="flex flex-col items-center gap-1 px-3 py-2">
          <BookmarkIcon className="w-5 h-5 text-gray-900" />
          <span className="text-xs">Saved</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 px-3 py-2">
          <User className="w-5 h-5 text-gray-900" />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
export default MobileNav;