import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppProvider } from './context/AppContext'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AppProvider><App/><Toaster position="bottom-right" richColors/></AppProvider></BrowserRouter></React.StrictMode>)
