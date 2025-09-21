import React, { useEffect, useState } from 'react'

function MainShop() {
  let [holdData, setholdData] = useState([])
  
    useEffect(()=>{
        fetch('https://fakestoreapi.com/products')
            .then(response => response.json())
            .then(data => setholdData(data));
    },[])
  return (
    <div>

      <div className=' min-h-screen bg-black grid grid-cols-5 gap-[10px] p-5'>
        {
           holdData.map((item) => (
            <div>
                <div className=' h-[150px] bg-white p-2'>
                    <img src={item.image} className=' h-full w-full' />
                </div>
                <h1 className=' text-white font-bold truncate'>{item.title}</h1>
                <h2 className=' text-sky-500'>${item.price}</h2>
            </div>
        ))}
    </div>
     

    </div>
  )
}

export default MainShop