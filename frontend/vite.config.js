import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('gsap')) {
              return 'gsap';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('@monaco-editor')) {
              return 'monaco';
            }
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './setupTests.js',
  }
})