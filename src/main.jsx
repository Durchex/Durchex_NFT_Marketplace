import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Index } from './Context/index.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Index>
    {/* <App /> */}
      <App />
      <Toaster />
    </Index>
  </StrictMode>,
)
