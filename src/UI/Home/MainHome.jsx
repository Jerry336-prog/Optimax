import React from "react";

function MainHome() {
  return (
    <div>
      <section className=" h-[500px] w-full bg-amber-600 flex items-center justify-center gap-4">
        <div className=" h-[80%] w-[50%] bg-amber-200 pl-[80px] pt-10">
          <h1 className=" text-2xl font-bold text-black">Welcome to</h1>
          <h1 className=" text-6xl font-extrabold text-purple-900">
            Optimax <br /> <span className=" text-[#4d014dfc]">Resources</span>
          </h1>
          <p className=" text-gray-600 mt-4">
            Upgrade Your Space with Smart Security & Connectivity. <br />
            From HD cameras to smart locks, we’ve got everything to keep you
            safe and connected.
          </p>
          <button className=" h-[40px] w-[100px] bg-blue-900">Shop Now</button>
        </div>
        <div className=" h-[80%] w-[50%] bg-gray-200"></div>
      </section>
    </div>
  );
}

export default MainHome;
