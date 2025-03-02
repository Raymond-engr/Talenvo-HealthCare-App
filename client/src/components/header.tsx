'use client';

import { Button } from '@/components/ui/button';
import { User, Calendar } from 'lucide-react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="w-full bg-white border-b sticky top-0 z-30">
      <div className="container mx-auto px-1">
        <div className="h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">TALENVO</Link>
          
          <div className="flex items-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-600 text-white rounded-md">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Book Appointment</span>
            </Button>
            <User className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;