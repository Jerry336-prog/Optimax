import React, {useState} from 'react'
import { Link } from "react-router-dom";
import { useLocation } from 'react-router-dom';    


function UserProfile() {
 let location = useLocation();
 let {fullName, email} = location.state || {};
  return (
<div className=' h-screen flex flex-col'>
    <div className='h-[10%] w-full flex justify-between sticky top-0 bg-gradient-to-b from-purple-50 to-white shadow-md z-50'>
        <section className=" flex items-center justify-center ml-6"> 
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-900 text-white font-bold">O</div>
            <span className="text-xl font-extrabold tracking-tight text-purple-900">PTIMAX</span>
            </section>
        
         <div className='absolute inset-x-0 z-20 w-full px-6 py-4 transition-all duration-300 ease-in-out bg-white dark:bg-white md:mt-0 md:p-0 md:top-0 md:relative md:bg-transparent md:w-auto md:opacity-100 md:translate-x-0 md:flex md:items-center '>
            <div className="flex flex-col md:flex-row md:mx-6">
              <Link className="my-2 flex items-center text-gray-700 transition-colors duration-300 transform dark:text-black hover:text-blue-500 dark:hover:text-blue-400 md:mx-4 md:my-0" to="/" >
                Home
              </Link>
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
          </div>
    </div>
<div className=' h-[90%] flex'>
        <nav className=' w-[30%] flex flex-col text-gray-700 bg-gradient-to-b from-purple-50 to-white pt-15'>
            <div className=' flex flex-col items-center gap-4 mb-8'>
                <img src="[]" className=" h-[150px] w-[150px] bg-gray-400 rounded-full" />
                <h1 className=' font-medium text-3xl'>Hi {fullName} 👏</h1>
                <p>{email}</p>
            </div>
            <ul className=' space-x-4 flex flex-col gap-4 items-start  mb-8'>
                <li className=' hover:bg-[#a855f7] p-2 rounded-md cursor-pointer w-full pl-7'>Edit Profile</li>
                <li className=' hover:bg-[#a855f7] p-2 rounded-md cursor-pointer  w-full pl-7'>My Orders</li>
                <li className=' hover:bg-[#a855f7] p-2 rounded-md cursor-pointer  w-full pl-7'>Addresses</li>
                <li className=' hover:bg-[#a855f7] p-2 rounded-md cursor-pointer  w-full pl-7'>Wishlist</li>
            </ul>
            <button className=' bg-purple-800 hover:bg-purple-900 cursor-pointer text-white w-[180px] ml-20 h-[40px] text-center text-xl flex justify-center items-center rounded-lg'>View All Orders</button>
        </nav>

        
<div className=' h-full w-full'>
        <div className="bg-gradient-to-b from-white to-purple-50 h-full p-8 shadow-sm">
      <div className=" mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Welcome to Your Smart Security Hub! 
            <span className="text-2xl ml-2">🏡</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover cutting-edge solar cameras and intelligent devices designed to protect what matters most.
          </p>
        </div>

        {/* Main Description */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <p className="text-gray-700 text-center mb-6">
            Transform your home or business with our premium collection of wireless solar-powered security cameras, 
            smart sensors, and automated devices. No wiring, no hassle – just reliable 24/7 protection powered by the sun.
          </p>
        </div>

        {/* Why Choose Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-purple-700 mb-4 text-center">Why Choose OPTIMAX?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Crystal Clear HD", desc: "Video quality day and night" },
              { title: "Smart AI Detection", desc: "For people, vehicles, and packages" },
              { title: "24/7 Protection", desc: "Powered by the sun" }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                <h3 className="font-semibold text-purple-700 mb-1">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-center mt-15 text-white">
          <h2 className="text-xl font-semibold mb-3">Ready to upgrade your security?</h2>
          <p className="mb-4 opacity-90">
            Browse our latest arrivals or check out your wishlist to continue where you left off. 
            Have questions? Our expert team is here to help you find the perfect smart solution for your needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white cursor-pointer text-purple-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Browse Products
            </button>
            <button className="bg-purple-800 cursor-pointer text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-900 transition-colors">
              View Wishlist
            </button>
          </div>
        </div>

      </div>
    </div>
    </div>
    </div>
    </div>
  )
}

export default UserProfile