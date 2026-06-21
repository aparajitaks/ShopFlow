import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pre-bundle Three.js ecosystem to avoid ESM/CJS issues during dev
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    port: 5173,
    // Proxy API calls to the Express backend in dev
    // Avoids CORS issues when running frontend and backend separately
    proxy: {
      '/trust-score': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
