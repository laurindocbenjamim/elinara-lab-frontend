import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    open: false,
    allowedHosts: [
      'elinara-auth-test.onrender.com',
      'elinara-lab-frontend.onrender.com',
    ],
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/auth2': {
        target: process.env.API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});