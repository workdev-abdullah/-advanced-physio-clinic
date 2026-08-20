import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose on network (required for ngrok/mobile access)
    port: 5173, // Explicit port (change if your Vite uses different, e.g., 3000)
    strictPort: true, // Fail if port taken
    allowedHosts: ['.ngrok-free.dev'], // Wildcard for all ngrok subdomains (fixes "host not allowed")
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // FIXED: Proxy the correct path for static files (PDFs are in uploads/receipts/)
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Ensure binary files (PDFs) are passed through correctly without corruption
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            if (proxyRes.headers['content-type']?.includes('application/pdf')) {
              proxyRes.headers['accept-ranges'] = 'bytes';
            }
          });
        },
      },
    },
  },
});