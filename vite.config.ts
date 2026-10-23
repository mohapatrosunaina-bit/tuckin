import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/restaurants': 'http://localhost:3001',
      '/api/menu-items': 'http://localhost:3001',
      '/api/orders': 'http://localhost:3002',
      '/api/delivery': 'http://localhost:3003'
    }
  }
})
