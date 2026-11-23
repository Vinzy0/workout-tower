/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// VITE_BASE: "/workout-tower/" for GitHub Pages, "/" for local dev and Capacitor.
// The PWA plugin derives manifest scope/start_url and the SW scope from `base`.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered in src/platform/native.ts (web only)
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Tower: workout logger',
        short_name: 'Tower',
        description: 'One-thumb workout logger with a streak tower.',
        theme_color: '#0D0D0F',
        background_color: '#0D0D0F',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    env: { TZ: 'Asia/Manila' },
  },
})
