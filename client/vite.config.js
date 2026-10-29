import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const isProd = mode === 'production'

  let apiUrl = env.VITE_API_URL || env.API_URL || ''
  let serverUrl = env.VITE_SERVER_URL || env.SERVER_URL || ''

  // Safeguard: Never bake localhost into production builds
  if (isProd) {
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      apiUrl = ''
    }
    if (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) {
      serverUrl = ''
    }
  }

  return {
    plugins: [react()],
    envDir: rootDir,
    envPrefix: ['VITE_', 'CLIENT_', 'API_', 'SERVER_'],
    define: {
      '__APP_API_URL__': JSON.stringify(apiUrl),
      '__APP_SERVER_URL__': JSON.stringify(serverUrl),
    },
    server: {
      port: 5173,
      proxy: {
        '/uploads': {
          target: 'http://localhost:5050',
          changeOrigin: true,
        },
      },
    },
  }
})
