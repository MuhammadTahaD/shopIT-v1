import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/react|scheduler/.test(id)) return 'react-vendor'
          if (id.includes('framer-motion')) return 'motion-vendor'
          if (id.includes('lucide-react')) return 'icons-vendor'
          if (id.includes('sonner')) return 'toast-vendor'
          if (id.includes('axios')) return 'network-vendor'
        },
      },
    },
  },
})
