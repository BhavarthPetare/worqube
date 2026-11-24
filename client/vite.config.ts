import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// In development the API runs separately (server/, port 5000); proxy /api to it so the
// browser sees one origin, exactly like production where Express serves this build.
export default defineConfig({
  server: {
    port: 8080,
    proxy: { '/api': 'http://localhost:5000' },
  },
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
