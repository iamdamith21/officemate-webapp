import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // host:true exposes the dev server on the LAN so the app can be opened
    // from phones/other devices via the machine's IP (e.g. http://192.168.x.x:5173).
    host: true,
    // Proxy API calls to the local Express backend so `/api/...` works in dev
    // exactly like it does in production (Vercel rewrite) — no CORS/URL juggling.
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 5000}`,
        changeOrigin: true,
      },
    },
  },
})
