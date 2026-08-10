import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 60 * 24, // 24 horas de retención en memoria
      refetchOnWindowFocus: false,
    },
  },
})

// Fix for Vite/Vercel chunk loading errors (MIME type error)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (posible actualización), forzando recarga...', event);
  window.location.reload();
});

import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Analytics />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
