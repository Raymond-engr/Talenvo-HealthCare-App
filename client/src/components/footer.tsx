import { Facebook, Twitter, Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-blue-600 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-xl mb-2">TALENVO</h3>
            <p className="text-sm">Talenvo@gmail.com</p>
          </div>
          <div className="flex gap-4">
            <Facebook className="w-5 h-5" />
            <Twitter className="w-5 h-5" />
            <Instagram className="w-5 h-5" />
          </div>
          <div className="text-sm text-center md:text-right">
            <p>© 2024 Talenvo</p>
            <div className="flex gap-4 justify-center md:justify-end mt-2">
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}