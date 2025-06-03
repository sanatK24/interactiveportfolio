import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: './', // Use relative paths for assets
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      strictPort: true,
    },
    preview: {
      port: 3000,
      strictPort: true,
    },
  };
});