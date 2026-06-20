import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [

    react(),
    tailwindcss(),
    VitePWA({ 
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000
      },
      manifest: {
        name: 'Iglesia Jerusalén',
        short_name: 'Jerusalén',
        description: 'Plataforma de la Iglesia del Evangelio Cuadrangular Jerusalén',
        theme_color: '#1E3A8A',
        background_color: '#F8FAFC',
        display: 'standalone',
      }
    })
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('maplibre-gl') || id.includes('react-map-gl') || id.includes('maplibre')) {
              return 'maplibre';
            }
            if (id.includes('@supabase') || id.includes('supabase-js')) {
              return 'supabase';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('react-router-dom') || id.includes('@tiptap') || id.includes('recharts')) {
              return 'vendor-libs';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            return 'commons';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
