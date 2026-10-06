import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress benign ResizeObserver errors caused by Recharts / layout recalculations
window.addEventListener('error', (e) => {
  if (e.message.includes('ResizeObserver loop limit exceeded') || e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    e.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
