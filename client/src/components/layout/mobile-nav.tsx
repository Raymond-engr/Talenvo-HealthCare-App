import Link from 'next/link'
import { Home, Search, Calendar, User } from 'lucide-react'

export function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white lg:hidden">
      <nav className="flex justify-around p-4">
        <Link href="/" className="flex flex-col items-center gap-1">
          <Home className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1">
          <Search className="w-5 h-5" />
          <span className="text-xs">Explore</span>
        </Link>
        <Link href="/appointments" className="flex flex-col items-center gap-1">
          <Calendar className="w-5 h-5" />
          <span className="text-xs">Appointments</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1">
          <User className="w-5 h-5" />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  )
}