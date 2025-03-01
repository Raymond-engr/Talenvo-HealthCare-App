import Image from 'next/image';
import Doctor1 from '../../public/assets/doc1.png'

const HeroSection = () => {
  return (
    <div className="relative w-full bg-blue-50 px-4 pt-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-row items-center justify-between">
          <div className="flex-1 mb-0 md:mr-12">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
              Your Path to
              <span className="text-sky-600"> Affordable Healthcare</span>
              <br />
              Starts Here
            </h2>
            <p className="text-zinc-700 text-xs md:text-sm mb-8">
              Easily locate providers, view services, and schedule
              your next visit with confidence
            </p>
          </div>
          
          <div className="flex-1">
            <Image 
              src={Doctor1}
              alt="Healthcare Professional"
              width={551}
              height={938}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection;