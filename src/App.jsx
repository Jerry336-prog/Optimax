import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Header from './constant/Header'
import Footer from './constant/Footer'
import MainHome from './UI/Home/MainHome'
import MainAbout from './UI/About/MainAbout'
import MainContact from './UI/Contact/MainContact'
import MainShop from './UI/Shop/MainShop'
import MainCart from './UI/Cart/MainCart'
import MainSignIn from './UI/sign in/MainSignIn'
import MainRegister from './UI/Register/MainRegister'
import Forgotpass from './UI/forgotPassword/Forgotpass'


function App() {
  

  return (
    <div>
     <BrowserRouter>
     <Routes>
      <Route
          path="/"
          element={
            <>
              <Header />
              <MainHome />
              <Footer />
            </>
          }
        />

      <Route
          path="/about"
          element={
            <>
              <Header />
              <MainAbout />
              <Footer />
            </>
          }
        />  
      
      <Route
          path="/contact"
          element={
            <>
              <Header />
              <MainContact />
              <Footer />
            </>
          }
        />

      <Route
          path="/shop"
          element={
            <>
              <Header />
              <MainShop />
              <Footer />
            </>
          }
        />    
      
      <Route
          path="/cart"
          element={
            <>
              <Header />
              <MainCart />
              <Footer />
            </>
          }
        />    
      <Route path="/MainSignIn" element={<MainSignIn />} />
      <Route path="/MainRegister" element={<MainRegister />} />
      <Route path='/forgotpass' element={<Forgotpass/>}/>
     </Routes>
     </BrowserRouter>
    </div>
  )
}

export default App
