import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppStoreProvider } from '@/hooks/use-app-store'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  </StrictMode>,
)
