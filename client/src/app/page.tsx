import HeroSection from '@/components/hero-section';
import SearchTabs from '@/components/search-tabs';
import { FAQSection } from '@/components/faq-section';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Doctor2 from '../../public/assets/doc2.png';

const features = [
  "Locate trusted doctors, clinics, and hospitals in your area.",
  "Compare consultation fees and check accepted insurance plans.",
  "Book appointments with reminders to ensure you never miss a visit.",
  "Help improve healthcare by sharing your feedback.",
  "Easily save hospitals for quick access to care in the future.",
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <HeroSection />
      
      <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-[500px] px-4">
        <div className="bg-neutral-200 rounded-2xl overflow-hidden flex flex-col justify-center items-center gap-2 p-1">
          <div className="w-full bg-white rounded-lg flex items-center">
            <SearchTabs />
          </div>
        </div>
      </div>

      <section className="w-full max-w-4xl px-4 py-20 md:py-40 justify-between bg-blue-200">
        <div className="grid md:grid-cols-[1fr_2fr] gap-2 items-center justify-center">
        <div className="flex justify-center items-center">
          <div className="relative w-[260px] h-[180px] sm:w-[280px] sm:h-[190px] md:w-[180px] md:h-[170px]">
            <Image
              src={Doctor2}
              alt="Doctor consultation"
              fill
              className="w-[260px] h-[180px] sm:w-[280px] sm:h-[190px] md:w-[180px] md:h-[170px] object-cover rounded-2xl"
            />
          </div>
          </div>
          <div className="space-y-2 order-1 md:order-1">
          <h2 className="text-xl font-semibold mb-2">Why Choose Our Platform?</h2>
          {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-4">
              <div className="w-0 h-0 flex items-start justify-center">
                <span><CheckCircle className="text-blue-400" /></span>
              </div>
              <p className='text-zinc-800 text-sm md:text-base font-medium font-nohemi'>{feature}</p>
            </div>
            ))}
          </div>
        </div>
      </section>
      <div className="flex items-start gap-4">
      <FAQSection />
      </div>
    </main>
  )
}
