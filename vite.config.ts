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
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      manifest: {
        name: 'Iglesia del Evangelio Cuadrangular Jerusalén',
        short_name: 'Jerusalén',
        description: 'Plataforma oficial de la Iglesia del Evangelio Cuadrangular Jerusalén',
        theme_color: '#1E3A8A',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/',
        id: '/',
        orientation: 'any',
        categories: ['religion', 'education', 'social'],
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          // NOTE: Add these icons to public/ for full PWA support:
          // { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          // { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // { src: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' }
        ],
        shortcuts: [
          { name: 'Eventos', short_name: 'Eventos', url: '/events', description: 'Ver próximos eventos' },
          { name: 'Sermones', short_name: 'Sermones', url: '/sermons', description: 'Escuchar sermones' },
          { name: 'Himnario', short_name: 'Himnario', url: '/songs', description: 'Cancionero de la iglesia' }
        ]
      }
    })
  ],
  esbuild: {
    // @ts-ignore
    drop: ['console', 'debugger'],
  },

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
            if (id.includes('@tiptap')) {
              return 'tiptap';
            }
            if (id.includes('emoji-mart') || id.includes('@emoji-mart')) {
              return 'emoji-mart';
            }
            if (id.includes('react-router-dom') || id.includes('recharts')) {
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
