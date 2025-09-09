import React from "react";

export default function EcommerceLanding() {
  const products = [
    { id: 1, name: "Auric Headphones", price: "$129", img: "https://picsum.photos/seed/p1/400/300" },
    { id: 2, name: "Lumen Lamp", price: "$79", img: "https://picsum.photos/seed/p2/400/300" },
    { id: 3, name: "Orbit Speaker", price: "$99", img: "https://picsum.photos/seed/p3/400/300" },
    { id: 4, name: "Nexa Watch", price: "$199", img: "https://picsum.photos/seed/p4/400/300" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* top nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-900 text-white font-bold">O</div>
            <span className="text-xl font-extrabold tracking-tight text-purple-900">PTIMAX</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <a href="#" className="hover:text-purple-900">Home</a>
            <a href="#products" className="hover:text-purple-900">Products</a>
            <a href="#about" className="hover:text-purple-900">About</a>
            <a href="#contact" className="hover:text-purple-900">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="hidden md:inline-block px-4 py-2 text-sm font-semibold rounded-md border border-purple-900 text-purple-900 hover:bg-purple-50">Sign in</button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900 text-white rounded-md shadow-sm hover:opacity-95">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4m12-4l2 4M9 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              Cart
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="bg-gradient-to-b from-white to-purple-50">
        <div className="container mx-auto px-6 py-16 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="inline-block px-3 py-1 text-sm font-semibold text-purple-900 bg-purple-100 rounded-full">New collection</p>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              Modern gadgets for everyday life
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-xl">
              Curated electronics with premium build and thoughtful design. Shop bestselling headphones, smart lamps, speakers and accessories.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#products" className="inline-block px-6 py-3 rounded-md bg-purple-900 text-white font-semibold shadow hover:opacity-95">Shop Now</a>
              <a href="#about" className="inline-block px-6 py-3 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50">Learn more</a>
            </div>

            <div className="mt-8 flex items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-purple-900">4.8</p>
                <p className="text-sm text-gray-500">Avg. Customer Rating</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-purple-900">10K+</p>
                <p className="text-sm text-gray-500">Happy customers</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
              <img src="https://picsum.photos/seed/hero/800/600" alt="hero product" className="w-full h-80 object-cover" />
            </div>

            <div className="absolute -bottom-10 left-6 w-60 p-4 bg-white rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500">Limited offer</p>
              <p className="font-semibold text-gray-900">Auric Headphones</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-gray-700">From <span className="font-bold text-purple-900">$99</span></div>
                <button className="px-3 py-1 rounded bg-purple-900 text-white text-sm">Buy</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* products grid */}
      <section id="products" className="container mx-auto px-6 py-20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Best sellers</h2>
          <a href="#" className="text-sm font-medium text-purple-900 hover:underline">View all</a>
        </div>

        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <img src={p.img} alt={p.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                <p className="mt-2 text-sm text-gray-600">High-quality build • 1 year warranty</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="font-bold text-purple-900">{p.price}</div>
                  <button className="px-3 py-1 bg-purple-900 text-white rounded-md text-sm">Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* trust & features */}
      <section className="bg-purple-900 text-white py-16">
        <div className="container mx-auto px-6 grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-bold">Fast shipping</h3>
            <p className="mt-2 text-sm text-purple-200">Free or discounted shipping on all orders above $50.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Secure payments</h3>
            <p className="mt-2 text-sm text-purple-200">Top-grade encryption and multiple payment options.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Hassle-free returns</h3>
            <p className="mt-2 text-sm text-purple-200">30-day returns on eligible items.</p>
          </div>
        </div>
      </section>

      {/* newsletter */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-purple-50 to-white rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-2xl font-bold text-gray-900">Stay in the loop</h4>
            <p className="mt-2 text-gray-600">Get 10% off your first order when you subscribe to our newsletter.</p>
          </div>

          <form className="w-full md:w-auto flex gap-3">
            <input type="email" placeholder="Enter your email" className="px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200" />
            <button className="px-6 py-3 rounded-md bg-purple-900 text-white font-semibold">Subscribe</button>
          </form>
        </div>
      </section>

      {/* footer */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 py-12 md:flex md:justify-between">
          <div>
            <div className="flex items-center gap-3">
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
    </div>
  );
}
