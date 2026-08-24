/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**', 'scratch/**'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({ 
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 900000,
        globIgnores: [
          '**/SongViewer-*.js',
          '**/CertificatesManager-*.js',
          '**/maplibre-*.js',
          '**/emoji-mart-*.js',
          '**/tiptap-*.js',
          '**/charts-*.js',
          '**/jspdf*.js',
          '**/html2canvas*.js',
          '**/react-core-*.js',
        ],
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
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ],
        shortcuts: [
          { name: 'Planifica tu Visita', short_name: 'Visita', url: '/visita', description: 'Información para primeros visitantes' },
          { name: 'Eventos', short_name: 'Eventos', url: '/eventos', description: 'Ver próximos eventos' },
          { name: 'Sermones', short_name: 'Sermones', url: '/predicas', description: 'Escuchar sermones' },
          { name: 'Himnario', short_name: 'Himnario', url: '/recursos/alabanzas', description: 'Cancionero de la iglesia' }
        ]
      }
    })
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
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
            if (id.includes('@tiptap')) {
              return 'tiptap';
            }
            if (id.includes('emoji-mart') || id.includes('@emoji-mart')) {
              return 'emoji-mart';
            }
            if (id.includes('react-router-dom')) {
              return 'vendor-libs';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('zod') || id.includes('react-hook-form')) {
              return 'forms';
            }
            if (id.includes('zustand')) {
              return 'state';
            }
            if (id.includes('sonner')) {
              return 'ui-primitives';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            return undefined;
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000
  }
})
