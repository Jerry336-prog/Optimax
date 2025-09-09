import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Footer from './constant/Footer.jsx'
import Extra from './UI/Extra.jsx'
import MainSignIn from './UI/sign in/MainSignIn.jsx'
import MainRegister from './UI/Register/MainRegister.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <Extra/> */}
  </StrictMode>,
)
