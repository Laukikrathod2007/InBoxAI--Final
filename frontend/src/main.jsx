import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './api.js'
import { installMockApi } from './demo/mockApi.js'

// `npm run build:demo` sets VITE_DEMO=1: the whole app runs in the browser on fake mail.
if (import.meta.env.VITE_DEMO === '1') installMockApi()
import Root from './Root.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
