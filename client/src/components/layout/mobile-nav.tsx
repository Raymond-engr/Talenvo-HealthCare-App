import Link from 'next/link'
import { Home, Search, BookmarkIcon, User } from 'lucide-react'

const MobileNav = () => {
  return (
    <div className="fixed z-20 bottom-0 left-0 right-0 border-t bg-white lg:hidden">
      <nav className="flex justify-around py-3">
        <Link href="/" className="flex flex-col items-center gap-1">
          <Home className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1">
          <Search className="w-5 h-5" />
          <span className="text-xs">Explore</span>
        </Link>
        <Link href="/saved" className="flex flex-col items-center gap-1">
          <BookmarkIcon className="w-5 h-5" />
          <span className="text-xs">Saved</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1">
          <User className="w-5 h-5" />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
export default MobileNav;