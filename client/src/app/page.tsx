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
      <div className="relative">
        <HeroSection />
        
        <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-[500px] px-4">
          <SearchTabs />
        </div>
      </div>

      <section className="w-full px-4 py-20 md:py-32 bg-blue-100">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center justify-center">
            <div className="flex justify-center items-center order-2 md:order-1">
              <div className="relative w-[280px] h-[190px]">
                <Image
                  src={Doctor2}
                  alt="Doctor consultation"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-4 order-1 md:order-2">
              <h2 className="text-xl font-semibold mb-4">Why Choose Our Platform?</h2>
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-800">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <FAQSection />
    </main>
  )
}