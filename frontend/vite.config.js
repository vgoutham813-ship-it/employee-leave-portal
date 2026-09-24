import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward /api/* requests to the Express backend in dev
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
