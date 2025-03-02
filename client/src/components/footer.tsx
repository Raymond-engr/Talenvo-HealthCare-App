import Link from 'next/link'
import { Instagram, Twitter, Facebook } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-blue-600 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-xl mb-2">TALENVO</h3>
            <p className="text-sm">Talenvo@gmail.com</p>
          </div>
          <div className="flex gap-4">
            <Link href="#" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </Link>
            <Link href="#" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </Link>
          </div>
          <div className="text-sm text-center md:text-right">
            <p>© 2024 Talenvo</p>
            <div className="flex gap-4 justify-center md:justify-end mt-2">
              <Link href="#" className="hover:underline">Terms of Service</Link>
              <Link href="#" className="hover:underline">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
export default Footer;