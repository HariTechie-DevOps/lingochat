import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1C1C1C',
            color: '#E8E6E0',
            border: '1px solid rgba(255,255,255,0.10)',
            fontSize: '0.8125rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
          success: {
            iconTheme: { primary: '#F5E642', secondary: '#0C0C0C' },
          },
          error: {
            iconTheme: { primary: '#FF2D87', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
