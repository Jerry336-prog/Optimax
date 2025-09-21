import React, {useState} from 'react'
import { Link } from "react-router-dom";
import { useLocation } from 'react-router-dom';   
import { VscGraph } from "react-icons/vsc"; 
import { FaUsers } from "react-icons/fa6";

function AdminDashboard() {

  let location = useLocation();
   let {fullName, email} = location.state || {};
  return (
    <div>
        <div className=' h-screen flex flex-col'>
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <div>
            <span className="text-xl font-bold text-gray-800">OPTIMAX</span>
            <span className="text-sm text-purple-600 ml-2">Admin</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <span className="text-2xl cursor-pointer hover:scale-110 transition-transform">🔔</span>
         
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">A</span>
            </div>
            <span className="text-sm font-medium text-slate-700">Admin</span>
          </div>
        </div>
      </header>
<div className=' h-[90%] flex'>
        <nav className=' w-[15%] flex flex-col text-gray-700 bg-gradient-to-b from-purple-50 to-white pt-15'>
            <ul className=' space-x-4 flex flex-col gap-4 mb-8 justify-center items-center'>
                <li className=' hover:bg-[#a855f7] hover:text-white p-2 h-[50px] rounded-md cursor-pointer w-[80%] flex items-center gap-2 font-bold'><span className=' text-2xl'> <VscGraph /> </span> Overview</li>
                <li className=' hover:bg-[#a855f7] hover:text-white p-2 h-[50px] rounded-md cursor-pointer  w-[80%] flex items-center gap-2 font-bold'><span className=' text-2xl'> <FaUsers /> </span> Users</li>
                <li className=' hover:bg-[#a855f7] hover:text-white p-2 h-[50px] rounded-md cursor-pointer   w-[80%] flex items-center gap-2 font-bold'><span className=' text-2xl'> <VscGraph /> </span>Orders</li>
                <li className=' hover:bg-[#a855f7] hover:text-white p-2 h-[50px] rounded-md cursor-pointer   w-[80%] flex items-center gap-2 font-bold'><span className=' text-2xl'> <VscGraph /> </span>Products</li>
                <li className=' hover:bg-[#a855f7] hover:text-white p-2 h-[50px] rounded-md cursor-pointer   w-[80%] flex items-center gap-2 font-bold'><span className=' text-2xl'> <VscGraph /> </span>Analytics</li>
                <li className=' hover:bg-[#a855f7] hover:text-white p-2 h-[50px] rounded-md cursor-pointer   w-[80%] flex items-center gap-2 font-bold'><span className=' text-2xl'> <VscGraph /> </span>Settings</li>
            </ul>
            <button className=' bg-purple-800 hover:bg-purple-900 cursor-pointer text-white w-[180px] ml-20 h-[40px] text-center text-xl flex justify-center items-center rounded-lg'>View All Orders</button>
        </nav>

        

    </div>
    </div>
    </div>
  )
}

export default AdminDashboard