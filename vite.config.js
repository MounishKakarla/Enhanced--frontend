import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/ems': 'http://localhost:8080',
    }
  },
  test: {
    exclude: ['**/node_modules/**', '**/e2e/**']
  }
})
