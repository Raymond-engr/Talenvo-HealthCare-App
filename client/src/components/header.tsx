'use client';

import { Button } from '@/components/ui/button';
import { User, Calendar } from 'lucide-react';

const Header = () => {
  return (
    <div className="w-full">
    <header className="h-10 sm:h-12 md:h-16 bg-white flex items-center justify-between px-2 sm:px-4 md:px-8">
      <h1 className="text-slate-700 text-sm md:text-xl font-semibold leading-tight">TALENVO</h1>
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <Button className="bg-sky-600 text-white text-xs md:text-sm font-light sm:font-normal md:font-medium px-1 sm:px-2 md:px-4 md:py-1 rounded flex items-center gap-1 md:gap-2">
          <Calendar className="w-1 h-1 sm:w-2 sm:h-2 md:w-6 md:h-6" />
          <span className="hidden sm:inline">Book Appointment</span>
          <span className="sm:hidden">Book</span>
        </Button>
        <div className="w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] md:w-[48px] md:h-[48px] rounded-full bg-gray-100 flex items-center justify-center">
        <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </div>
      </div>
    </header>
    </div>
  );
}

export default Header;