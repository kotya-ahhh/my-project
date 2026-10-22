import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.API_URL || 'http://localhost:3001';

export default defineConfig({
  base: '/my-project/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: API, changeOrigin: true } },
  },
  preview: { proxy: { '/api': { target: API, changeOrigin: true } } },
});