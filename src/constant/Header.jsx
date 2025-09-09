import React, { useState } from "react";
import { Link } from "react-router-dom";

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className=" ">
      <nav className="relative bg-white shadow dark:bg-white"> 
        <div className=" py-4 lg:px-10 md:pl-4 md:flex md:justify-between md:items-center w-[100%]">
          <div className="flex items-center justify-between pr-4 pl-4">
            <section className=" flex items-center justify-center"> 
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-900 text-white font-bold">O</div>
            <span className="text-xl font-extrabold tracking-tight text-purple-900">PTIMAX</span>
            </section>
            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button onClick={() => setIsOpen(!isOpen)} type="button" className="text-gray-500 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 focus:outline-none focus:text-gray-600 dark:focus:text-gray-400" aria-label="toggle menu" >
                {!isOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`absolute inset-x-0 z-20 w-full px-6 py-4 transition-all duration-300 ease-in-out bg-white dark:bg-white md:mt-0 md:p-0 md:top-0 md:relative md:bg-transparent md:w-auto md:opacity-100 md:translate-x-0 md:flex md:items-center ${isOpen ? "translate-x-0 opacity-100" : "opacity-0 -translate-x-full md:opacity-100"}`}>
            <div className="flex flex-col md:flex-row md:mx-6">
              <Link className="my-2 text-gray-700 transition-colors duration-300 transform dark:text-black hover:text-blue-500 dark:hover:text-blue-400 md:mx-4 md:my-0" to="/" >
                Home
              </Link>
              <Link
                className="my-2 text-gray-700 transition-colors duration-300 transform 
                           dark:text-black hover:text-blue-500 dark:hover:text-blue-400 
                           md:mx-4 md:my-0"
                to="/shop"
              >
                Shop
              </Link>
              <Link
                className="my-2 text-gray-700 transition-colors duration-300 transform 
                           dark:text-black hover:text-blue-500 dark:hover:text-blue-400 
                           md:mx-4 md:my-0"
                to="/contact"
              >
                Contact
              </Link>
              <Link
                className="my-2 text-gray-700 transition-colors duration-300 transform 
                           dark:text-black hover:text-blue-500 dark:hover:text-blue-400 
                           md:mx-4 md:my-0"
                to="/about"
              >
                About
              </Link>
        
               
                <a className="relative text-gray-700 transition-colors duration-300 transform dark:text-gray-600 hover:text-purple-900 dark:hover:text-purple-900 md:hidden flex justify-center" href="#">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>

                    <span className="absolute top-0 left-40 p-1 text-xs text-white bg-blue-500 rounded-full"></span>
              
              </a>
            </div>

            <div className="flex justify-center md:block">
              <Link className="my-2 text-gray-700 transition-colors duration-300 transform 
                           dark:text-black hover:text-blue-500 dark:hover:text-blue-400 
                           md:mx-4 md:my-0 hidden md:block" 
                to="/cart">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900 text-white rounded-md shadow-sm hover:opacity-95">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4m12-4l2 4M9 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              Cart
            </button>
              </Link>
            </div>
            <a
                className="my-2 text-gray-700 transition-colors duration-300 transform 
                           dark:text-black hover:text-blue-500 dark:hover:text-blue-400 
                           md:mx-4 md:my-0 hidden md:block" 
                href="/MainSignIn"
              >
               <button className="hidden md:inline-block px-4 py-2 text-sm font-semibold rounded-md border border-purple-900 text-purple-900 hover:bg-purple-50">Sign in</button>
              </a>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
