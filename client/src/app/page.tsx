import { HeroSection } from "@/components/hero-section"
import { SearchTabs } from "@/components/search-tabs"
import { FAQSection } from "@/components/faq-section"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <HeroSection />
      
      <SearchTabs />
      
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Why Choose Our Platform?</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[300px]">
            <Image
              src="/placeholder.svg"
              alt="Doctor consultation"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Flexible consultation time and service provided</h3>
              <p className="text-gray-600">Book appointments with available doctors at your convenience</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Built specifically with simplicity in mind</h3>
              <p className="text-gray-600">Easy-to-use interface for booking and managing appointments</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Free signup and book service</h3>
              <p className="text-gray-600">No hidden fees for using our platform</p>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
    </main>
  )
}