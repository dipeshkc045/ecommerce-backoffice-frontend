import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true, // Keycloak only accepts redirects back to this exact origin
      proxy: {
        // The platform's admin API (commerce-core). Same origin in the browser, so no CORS is needed;
        // in production the admin app is served behind the same gateway (ADR-0013).
        '/admin': {
          target: env.VITE_ADMIN_API_TARGET || 'http://localhost:8180',
          changeOrigin: true,
        },
      },
    },
  }
})
