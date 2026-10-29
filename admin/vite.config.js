import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function watchRootEnvPlugin() {
  return {
    name: 'watch-root-env',
    configureServer(server) {
      const rootEnvPath = path.resolve(rootDir, '.env')
      server.watcher.add(rootEnvPath)
      server.watcher.on('change', (file) => {
        if (path.resolve(file) === rootEnvPath) {
          console.log('[Vite] Root .env changed, triggering reload/restart...')
          server.restart()
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const isProd = mode === 'production'

  const primaryColor = env.PRIMARY_COLOR || env.ADMIN_PRIMARY_COLOR || env.VITE_PRIMARY_COLOR || '#84b701'
  let apiUrl = env.VITE_API_URL || env.API_URL || ''
  let serverUrl = env.VITE_SERVER_URL || env.SERVER_URL || ''
  let clientUrl = env.CLIENT_URL || ''

  // Safeguard: Never bake localhost into production builds
  if (isProd) {
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      apiUrl = ''
    }
    if (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) {
      serverUrl = ''
    }
    if (clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1') || !clientUrl) {
      clientUrl = 'https://bcf.org.bd'
    }
  }

  // Base path: In production, default to './' so assets load properly whether deployed under /admin/ or at root of admin.bcf.org.bd
  let adminBasePath = env.ADMIN_BASE_PATH || env.VITE_BASE || './'
  if (isProd && adminBasePath === '/') {
    adminBasePath = './'
  }

  return {
    base: adminBasePath,
    plugins: [react(), watchRootEnvPlugin()],
    envDir: rootDir,
    envPrefix: ['VITE_', 'ADMIN_', 'PRIMARY_', 'API_', 'SERVER_', 'CLIENT_'],
    define: {
      '__APP_PRIMARY_COLOR__': JSON.stringify(primaryColor),
      '__APP_API_URL__': JSON.stringify(apiUrl),
      '__APP_SERVER_URL__': JSON.stringify(serverUrl),
      '__APP_CLIENT_URL__': JSON.stringify(clientUrl),
      '__APP_BASE_PATH__': JSON.stringify(adminBasePath),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/uploads': {
          target: 'http://localhost:5050',
          changeOrigin: true,
        },
      },
    },
  }
})
