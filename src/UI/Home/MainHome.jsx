import React from "react";

function MainHome() {
  return (
    <div>
      <section className=" h-[600px] w-full bg-gradient-to-b from-white to-purple-50 flex items-center justify-center gap-4">
        <div className=" h-[80%] w-[55%] pt-10 pl-[60px]">
          <h1 className=" text-2xl font-bold text-black">Welcome to</h1>
          <h1 className=" text-7xl font-extrabold text-purple-900">
            Optimax <br /> <span className=" text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-900">Resources</span>
          </h1>
          <p className=" text-gray-600 mt-4 mb-6">
            Upgrade Your Space with Smart Security & Connectivity. <br />
            From HD cameras to smart locks, we’ve got everything to keep you
            safe and connected.
          </p> 
          <button className=" h-[50px] w-[130px] bg-purple-900 font-medium text-[19px] rounded-[10px] text-white mr-3.5">Shop Now</button>
          <button className=" h-[50px] w-[130px] border-1 font-light border-gray-200 rounded-[10px] text-black">Learn more</button>
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
        <div className=" h-[55%] w-[45%] mr-[100px]">
          <img src="optimax_home.jpeg" className=" h-[100%] w-[100%] rounded-[20px] shadow-2xl "/>
        </div>
      </section>
    </div>
  );
}

export default MainHome;
