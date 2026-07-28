import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    // Asset URLs are stored root-relative ("/api/assets/:id") so they work in
    // any environment. In dev the API lives on :5000, so proxy /api across.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
