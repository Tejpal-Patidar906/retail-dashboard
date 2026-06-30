import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#131829',
          color: '#E2E8F8',
          border: '1px solid #1E2640',
          borderRadius: '10px',
          fontSize: '0.875rem',
        },
        success: { iconTheme: { primary: '#34D99E', secondary: '#131829' } },
        error:   { iconTheme: { primary: '#F0616B', secondary: '#131829' } },
      }}
    />
  </React.StrictMode>,
)
