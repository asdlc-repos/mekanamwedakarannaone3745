import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    proxy: {
      '/api/leave': {
        target: process.env.LEAVE_SERVICE_URL || 'http://leave-service:9090',
        rewrite: (path) => path.replace(/^\/api\/leave/, ''),
        changeOrigin: true,
      },
      '/api/user': {
        target: process.env.USER_SERVICE_URL || 'http://user-service:9090',
        rewrite: (path) => path.replace(/^\/api\/user/, ''),
        changeOrigin: true,
      },
    },
  },
})
