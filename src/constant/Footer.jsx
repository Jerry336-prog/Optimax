import React from 'react'

function Footer() {
  return (
   
    <footer className="bg-gray-50 border-t border-gray-100 ">
        <div className="container mx-auto px-6 py-12 md:flex md:justify-between">
          <div>
            <div className="flex items-center gap-0.5">
              <div className="w-10 h-10 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold">O</div>
              <span className="font-bold text-purple-900">PTIMAX</span>
            </div>
            <p className="mt-4 text-sm text-gray-600 max-w-sm">High-quality electronics with thoughtful design and fast delivery.</p>
          </div>

          <div className="mt-8 md:mt-0 grid grid-cols-2 gap-8 text-sm text-gray-700">
            <div>
              <h5 className="font-semibold text-gray-900">Shop</h5>
              <ul className="mt-3 space-y-2">
                <li><a href="#" className="hover:text-purple-900">Headphones</a></li>
                <li><a href="#" className="hover:text-purple-900">Speakers</a></li>
                <li><a href="#" className="hover:text-purple-900">Accessories</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900">Company</h5>
              <ul className="mt-3 space-y-2">
                <li><a href="#" className="hover:text-purple-900">About</a></li>
                <li><a href="#" className="hover:text-purple-900">Careers</a></li>
                <li><a href="#" className="hover:text-purple-900">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8">
          <div className="container mx-auto px-6 py-6 text-sm text-gray-500">© {new Date().getFullYear()} OPTIMAX • All rights reserved</div>
        </div>
      </footer>

  )
}

export default Footer

