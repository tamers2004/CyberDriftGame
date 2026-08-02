import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Cyber Drift',
        short_name: 'CyberDrift',
        description: 'A cyberpunk arcade drifting game, fully in the browser.',
        theme_color: '#0b0f1a',
        background_color: '#0b0f1a',
        display: 'fullscreen',
        start_url: '/',
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
})
